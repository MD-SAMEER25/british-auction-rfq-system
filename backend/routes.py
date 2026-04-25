from flask import request, jsonify
from datetime import datetime, timedelta

def register_routes(app, db):
    from models import init_models
    RFQ, Auction, Bid, ActivityLog = init_models(db)

    @app.route('/api/rfq', methods=['POST'])
    def create_rfq():
        data = request.json
        forced = datetime.fromisoformat(data['forced_close'])
        bid_close = datetime.fromisoformat(data['bid_close'])
        if forced <= bid_close:
            return jsonify({'error': 'Forced close must be after bid close'}), 400
        rfq = RFQ(
            name=data['name'],
            reference_id=data['reference_id'],
            bid_start=datetime.fromisoformat(data['bid_start']),
            bid_close=bid_close,
            forced_close=forced,
            pickup_date=datetime.fromisoformat(data.get('pickup_date', data['bid_close']))
        )
        db.session.add(rfq)
        db.session.flush()
        auction = Auction(
            rfq_id=rfq.id,
            trigger_window_mins=int(data.get('trigger_window_mins', 10)),
            extension_duration_mins=int(data.get('extension_duration_mins', 5)),
            extension_trigger=data.get('extension_trigger', 'any_bid'),
            current_bid_close=bid_close
        )
        db.session.add(auction)
        db.session.commit()
        return jsonify({'message': 'RFQ created!', 'rfq_id': rfq.id}), 201

    @app.route('/api/auctions', methods=['GET'])
    def get_auctions():
        auctions = Auction.query.all()
        result = []
        for a in auctions:
            lowest_bid = db.session.query(
                db.func.min(Bid.freight_charges + Bid.origin_charges + Bid.destination_charges)
            ).filter_by(auction_id=a.id).scalar()
            result.append({
                'id': a.id,
                'rfq_name': a.rfq.name,
                'reference_id': a.rfq.reference_id,
                'current_bid_close': a.current_bid_close.isoformat(),
                'forced_close': a.rfq.forced_close.isoformat(),
                'status': a.status,
                'lowest_bid': lowest_bid
            })
        return jsonify(result)

    @app.route('/api/auction/<int:auction_id>', methods=['GET'])
    def get_auction_detail(auction_id):
        auction = Auction.query.get_or_404(auction_id)
        bids = Bid.query.filter_by(auction_id=auction_id).order_by(
            Bid.freight_charges + Bid.origin_charges + Bid.destination_charges
        ).all()
        logs = ActivityLog.query.filter_by(auction_id=auction_id).order_by(
            ActivityLog.created_at
        ).all()
        bids_data = [{
            'id': b.id,
            'carrier_name': b.carrier_name,
            'freight_charges': b.freight_charges,
            'origin_charges': b.origin_charges,
            'destination_charges': b.destination_charges,
            'total': b.total,
            'transit_time': b.transit_time,
            'submitted_at': b.submitted_at.isoformat(),
            'rank': b.rank
        } for b in bids]
        logs_data = [{
            'event_type': l.event_type,
            'reason': l.reason,
            'old_close': l.old_close.isoformat() if l.old_close else None,
            'new_close': l.new_close.isoformat() if l.new_close else None,
            'created_at': l.created_at.isoformat()
        } for l in logs]
        return jsonify({
            'auction': {
                'id': auction.id,
                'rfq_name': auction.rfq.name,
                'current_bid_close': auction.current_bid_close.isoformat(),
                'forced_close': auction.rfq.forced_close.isoformat(),
                'trigger_window_mins': auction.trigger_window_mins,
                'extension_duration_mins': auction.extension_duration_mins,
                'extension_trigger': auction.extension_trigger,
                'status': auction.status
            },
            'bids': bids_data,
            'logs': logs_data
        })

    @app.route('/api/bid', methods=['POST'])
    def submit_bid():
        data = request.json
        auction = Auction.query.get_or_404(data['auction_id'])
        now = datetime.utcnow()
        if auction.status != 'active' or now > auction.current_bid_close:
            return jsonify({'error': 'Auction is closed'}), 400
        if now > auction.rfq.forced_close:
            auction.status = 'force_closed'
            db.session.commit()
            return jsonify({'error': 'Auction force closed'}), 400
        bid = Bid(
            auction_id=auction.id,
            carrier_name=data['carrier_name'],
            freight_charges=float(data['freight_charges']),
            origin_charges=float(data.get('origin_charges', 0)),
            destination_charges=float(data.get('destination_charges', 0)),
            transit_time=int(data.get('transit_time', 0)),
            submitted_at=now
        )
        db.session.add(bid)
        db.session.flush()
        all_bids = Bid.query.filter_by(auction_id=auction.id).order_by(
            Bid.freight_charges + Bid.origin_charges + Bid.destination_charges
        ).all()
        for i, b in enumerate(all_bids):
            b.rank = i + 1
        trigger_window = timedelta(minutes=auction.trigger_window_mins)
        window_start = auction.current_bid_close - trigger_window
        should_extend = False
        reason = ''
        if auction.extension_trigger == 'any_bid' and now >= window_start:
            should_extend = True
            reason = f'New bid received in last {auction.trigger_window_mins} mins'
        elif auction.extension_trigger == 'any_rank_change' and now >= window_start:
            should_extend = True
            reason = 'Supplier rank changed in trigger window'
        elif auction.extension_trigger == 'l1_rank_change' and bid.rank == 1 and now >= window_start:
            should_extend = True
            reason = 'L1 (lowest) bidder changed in trigger window'
        if should_extend:
            new_close = auction.current_bid_close + timedelta(minutes=auction.extension_duration_mins)
            if new_close > auction.rfq.forced_close:
                new_close = auction.rfq.forced_close
            log = ActivityLog(
                auction_id=auction.id,
                bid_id=bid.id,
                event_type='time_extended',
                reason=reason,
                old_close=auction.current_bid_close,
                new_close=new_close
            )
            db.session.add(log)
            auction.current_bid_close = new_close
        db.session.commit()
        return jsonify({'message': 'Bid submitted!', 'rank': bid.rank}), 201
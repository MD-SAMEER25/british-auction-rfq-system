from datetime import datetime

RFQ = None
Auction = None
Bid = None
ActivityLog = None

def init_models(db):
    global RFQ, Auction, Bid, ActivityLog

    if RFQ is not None:
        return RFQ, Auction, Bid, ActivityLog

    class RFQ_(db.Model):
        __tablename__ = 'rfq'
        id = db.Column(db.Integer, primary_key=True)
        name = db.Column(db.String(200), nullable=False)
        reference_id = db.Column(db.String(100), unique=True)
        bid_start = db.Column(db.DateTime, nullable=False)
        bid_close = db.Column(db.DateTime, nullable=False)
        forced_close = db.Column(db.DateTime, nullable=False)
        pickup_date = db.Column(db.DateTime)
        status = db.Column(db.String(50), default='active')
        auctions = db.relationship('Auction_', backref='rfq', lazy=True)

    class Auction_(db.Model):
        __tablename__ = 'auction'
        id = db.Column(db.Integer, primary_key=True)
        rfq_id = db.Column(db.Integer, db.ForeignKey('rfq.id'), nullable=False)
        trigger_window_mins = db.Column(db.Integer, default=10)
        extension_duration_mins = db.Column(db.Integer, default=5)
        extension_trigger = db.Column(db.String(50), default='any_bid')
        current_bid_close = db.Column(db.DateTime, nullable=False)
        status = db.Column(db.String(50), default='active')
        bids = db.relationship('Bid_', backref='auction', lazy=True)
        logs = db.relationship('ActivityLog_', backref='auction', lazy=True)

    class Bid_(db.Model):
        __tablename__ = 'bid'
        id = db.Column(db.Integer, primary_key=True)
        auction_id = db.Column(db.Integer, db.ForeignKey('auction.id'), nullable=False)
        carrier_name = db.Column(db.String(200), nullable=False)
        freight_charges = db.Column(db.Float, nullable=False)
        origin_charges = db.Column(db.Float, default=0)
        destination_charges = db.Column(db.Float, default=0)
        transit_time = db.Column(db.Integer)
        quote_validity = db.Column(db.DateTime)
        submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
        rank = db.Column(db.Integer)

        @property
        def total(self):
            return self.freight_charges + self.origin_charges + self.destination_charges

    class ActivityLog_(db.Model):
        __tablename__ = 'activity_log'
        id = db.Column(db.Integer, primary_key=True)
        auction_id = db.Column(db.Integer, db.ForeignKey('auction.id'), nullable=False)
        bid_id = db.Column(db.Integer, db.ForeignKey('bid.id'), nullable=True)
        event_type = db.Column(db.String(100))
        reason = db.Column(db.String(300))
        old_close = db.Column(db.DateTime)
        new_close = db.Column(db.DateTime)
        created_at = db.Column(db.DateTime, default=datetime.utcnow)

    RFQ = RFQ_
    Auction = Auction_
    Bid = Bid_
    ActivityLog = ActivityLog_

    return RFQ, Auction, Bid, ActivityLog
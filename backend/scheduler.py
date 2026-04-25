from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime

def start_scheduler(app, db):

    scheduler = BackgroundScheduler()

    def check_auctions():
        with app.app_context():
            try:
                from models import init_models
                _, Auction, _, _ = init_models(db)
                now = datetime.utcnow()
                print(f"⏰ Scheduler running at {now}")
                active = Auction.query.filter_by(status='active').all()
                print(f"Found {len(active)} active auctions")
                for auction in active:
                    print(f"Auction {auction.id} close time: {auction.current_bid_close} | now: {now}")
                    if now >= auction.rfq.forced_close:
                        auction.status = 'force_closed'
                        print(f"⚡ Auction {auction.id} → force_closed")
                    elif now >= auction.current_bid_close:
                        auction.status = 'closed'
                        print(f"✅ Auction {auction.id} → closed")
                db.session.commit()
                print("✅ DB committed!")
            except Exception as e:
                print(f"❌ Scheduler error: {e}")

    scheduler.add_job(check_auctions, 'interval', seconds=30)
    scheduler.start()
    print("✅ Scheduler started!")
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:username@localhost/gocomet_rfq'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)

    with app.app_context():
        from models import init_models
        init_models(db)
        db.create_all()
        print("✅ Tables created!")

    from routes import register_routes
    register_routes(app, db)

    from scheduler import start_scheduler
    start_scheduler(app, db)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)

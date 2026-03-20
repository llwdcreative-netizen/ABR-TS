from flask import Flask
import os

from backend.db import init_db

from backend.routes.auth import auth_bp
from backend.routes.purchase import purchase_bp

from backend.admin.admin_auth import admin_auth
from backend.admin.admin_pages import admin_pages
from backend.admin.admin_api import admin_api_bp

from backend.public import public_bp
from backend.mp.routes import mp_routes

def create_app():
    app = Flask(
    __name__,
    instance_relative_config=True,
    instance_path=os.path.join(os.path.dirname(__file__), "instance")
)
    os.makedirs(app.instance_path, exist_ok=True)

    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev-key")
    )

    app.register_blueprint(auth_bp)
    app.register_blueprint(purchase_bp)

    app.register_blueprint(admin_auth)
    app.register_blueprint(admin_pages)
    app.register_blueprint(admin_api_bp)

    app.register_blueprint(public_bp)
    app.register_blueprint(mp_routes)

    with app.app_context():
        init_db()

    return app

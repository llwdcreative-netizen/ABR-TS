import os


MP_NOTIFICATION_URL = os.environ.get("MP_NOTIFICATION_URL")
MP_ACCESS_TOKEN = os.environ.get("MP_ACCESS_TOKEN")
MP_WEBHOOK_SECRET = os.environ.get("MP_WEBHOOK_SECRET")

MAIL_USER = os.environ.get("MAIL_USER")
MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")

SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")



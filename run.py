from dotenv import load_dotenv
import os

# 👇 CARGAR .env PRIMERO
load_dotenv()

from backend import create_app

app = create_app()

UPLOAD_FOLDER = os.path.join("static", "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config.from_object("backend.config")

if __name__ == "__main__":
    print("USANDO BASE:", app.config["SQLALCHEMY_DATABASE_URI"])

    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
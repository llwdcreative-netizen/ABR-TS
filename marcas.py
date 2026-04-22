from backend.db import get_db
from dotenv import load_dotenv
import os

# Cargar variables del .env
load_dotenv()

db_url = os.getenv("DATABASE_URL")

if not db_url:
    raise RuntimeError("DATABASE_URL no está configurada")

with get_db() as db:
    with db.cursor() as cur:
        cur.execute("""
            INSERT INTO marcas (nombre) VALUES
            ('Apple'),
            ('Samsung'),
            ('Motorola'),
            ('TCL'),
            ('Xiaomi'),
            ('ZTE')
            ON CONFLICT (nombre) DO NOTHING;
        """)
    db.commit()

print("✅ Marcas restauradas")
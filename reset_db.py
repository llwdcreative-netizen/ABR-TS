from backend.db import get_db
from dotenv import load_dotenv
import os

# Cargar variables del .env
load_dotenv()

db_url = os.getenv("DATABASE_URL")

if not db_url:
    raise RuntimeError("DATABASE_URL no está configurada")

print("🔥 Usando DB:", db_url)
print("🧨 Borrando datos...")

with get_db() as db:
    with db.cursor() as cur:
        cur.execute("""
            TRUNCATE TABLE 
                historial_estados,
                envios,
                historial,
                turnos,
                help_messages,
                reviews,
                favoritos,
                productos,
                subcategorias,
                categorias,
                marcas,
                users
            RESTART IDENTITY CASCADE;
        """)
    db.commit()
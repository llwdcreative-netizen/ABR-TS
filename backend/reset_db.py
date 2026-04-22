from backend.db import get_db

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
from backend.db import get_db

def validar_referencia(tipo, referencia_id):
    db = get_db()
    try:
        cur = db.cursor()

        if tipo == "envio":
            cur.execute(
                "SELECT 1 FROM envios WHERE id = %s",
                (referencia_id,)
            )
        elif tipo == "retiro":
            cur.execute(
                """
                SELECT 1 FROM historial
                WHERE id = %s AND tipo = 'retiro'
                """,
                (referencia_id,)
            )
        else:
            return False  # tipo inválido

        return cur.fetchone() is not None

    except Exception as e:
        print("Error validando referencia:", e)
        return False

    finally:
        db.close()
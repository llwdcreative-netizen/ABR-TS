import smtplib
from email.mime.text import MIMEText
from flask import current_app
from datetime import datetime
from zoneinfo import ZoneInfo

from backend.db import get_db

def crear_notificacion_admin(titulo, mensaje, tipo="general", referencia_id=None):
    crear_notificacion(
        usuario_id=None,   #no pertenece a un usuario específico
        rol="admin",
        titulo=titulo,
        mensaje=mensaje,
        referencia_id=referencia_id,
        tipo=tipo
    )

def enviar_email(destinatario, asunto, mensaje):
    msg = MIMEText(mensaje)
    msg["Subject"] = asunto
    msg["From"] = current_app.config["MAIL_USER"]
    msg["To"] = destinatario

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(
            current_app.config["MAIL_USER"],
            current_app.config["MAIL_PASSWORD"]
        )
        server.send_message(msg)


def notificar_pago_aprobado(email_cliente, referencia_id):
    asunto = "Pago aprobado ✅"
    mensaje = f"""
    Tu pago fue aprobado.

    Número de referencia: {referencia_id}

    Gracias por tu compra.
    """

    enviar_email(email_cliente, asunto, mensaje)


# CREAR NOTIFICACIONES

def crear_notificacion(
    usuario_id,
    rol,
    titulo,
    mensaje,
    referencia_id=None,
    tipo="general"
):

    print("🟡 INSERT NOTIFICACION:", titulo, mensaje, rol)

    db = get_db()
    cur = db.cursor()

    fecha = datetime.now(
        ZoneInfo("America/Argentina/Buenos_Aires")
    )

    cur.execute("""
        INSERT INTO notificaciones 
        (usuario_id, rol, titulo, mensaje, tipo, leida, referencia_id, fecha)
        VALUES (%s, %s, %s, %s, %s, False, %s, %s)
    """, (
        usuario_id,
        rol,
        titulo,
        mensaje,
        tipo,
        referencia_id,
        fecha
    ))

    db.commit()
    db.close()

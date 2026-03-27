from flask import Blueprint, request, jsonify, redirect, current_app
from backend.mp.service import create_mp_preference_service
from backend.services.notification_service import (
    notificar_pago_aprobado,
    crear_notificacion,
    crear_notificacion_admin
)

import hmac
import hashlib

from backend.db import get_db


mp_routes = Blueprint("mp", __name__)


@mp_routes.route("/create_preference", methods=["POST"])
def create_preference():
    data = request.get_json(force=True)
    print("BODY /create_preference:", data)

    metadata = data.get("metadata", {})
    payer = data.get("payer", {})
    items = data.get("items", [])

    tipo = metadata.get("tipo")
    referencia_id = metadata.get("referencia_id")

    # =========================
    # VALIDACIONES
    # =========================
    if tipo not in ("envio", "retiro"):
        return jsonify({"ok": False, "error": "Tipo inválido"}), 400

    if not referencia_id:
        return jsonify({"ok": False, "error": "Falta referencia_id"}), 400

    if not items:
        return jsonify({"ok": False, "error": "Sin items"}), 400

    db = get_db()
    cur = db.cursor()

    if tipo == "envio":
        cur.execute("SELECT id FROM envios WHERE id = %s", (referencia_id,))
    else:
        cur.execute("""
            SELECT id FROM historial 
            WHERE id = %s AND tipo = 'retiro'
        """, (referencia_id,))

    if not cur.fetchone():
        db.close()
        return jsonify({"ok": False, "error": "Pedido inexistente"}), 400

    db.close()

    # =========================
    # ARMAR ITEMS
    # =========================
    mp_items = []

    for item in items:
        cantidad = int(item.get("quantity") or item.get("cantidad") or 1)
        precio = float(item.get("unit_price") or item.get("price") or 0)

        if cantidad <= 0 or precio <= 0:
            continue

        mp_items.append({
            "title": item.get("title") or "Producto",
            "quantity": cantidad,
            "unit_price": precio,
            "currency_id": "ARS"
        })

    if not mp_items:
        return jsonify({"ok": False, "error": "Items inválidos"}), 400

    # =========================
    # SHIPPING SOLO ENVÍO
    # =========================
    if tipo == "envio":
        db = get_db()
        cur = db.cursor()

        cur.execute("SELECT valor FROM configuracion WHERE clave = 'shipping_cost'")
        row = cur.fetchone()
        db.close()

        if row:
            mp_items.append({
                "title": "Costo de envío",
                "quantity": 1,
                "unit_price": float(row["valor"]),
                "currency_id": "ARS"
            })

    # =========================
    # CREAR PREFERENCIA
    # =========================
    pref_id = create_mp_preference_service({
        "items": mp_items,
        "metadata": {   # 🔥 CLAVE
            "tipo": tipo,
            "referencia_id": referencia_id
        },
        "payer": payer
    })

    return jsonify({
        "ok": True,
        "preference_id": pref_id
    })





@mp_routes.route("/mp/webhook", methods=["POST"])
def mp_webhook():
    print("🔥 WEBHOOK RECIBIDO")

    #if not validar_firma_mp(request):
        #return "Invalid signature", 403

    data = request.get_json(silent=True)
    if not data:
        return "OK", 200

    data = request.get_json(silent=True) or {}

    topic = (
        request.args.get("type")
        or request.args.get("topic")
        or data.get("type")
    )

    if topic != "payment":
        return "OK", 200

    payment_id = data.get("data", {}).get("id")
    if not payment_id:
        return "OK", 200

    import requests
    mp_token = current_app.config["MP_ACCESS_TOKEN"]

    r = requests.get(
        f"https://api.mercadopago.com/v1/payments/{payment_id}",
        headers={"Authorization": f"Bearer {mp_token}"}
    )

    pago = r.json()

    print("👉 STATUS PAGO:", pago.get("status"))
    print("👉 METADATA:", pago.get("metadata"))

    if pago.get("status") != "approved":
        return "OK", 200

    metadata = pago.get("metadata", {})
    tipo = metadata.get("tipo")
    referencia_id = metadata.get("referencia_id")

    print("👉 TIPO:", tipo)
    print("👉 REFERENCIA:", referencia_id)

    if not tipo or not referencia_id:
        return "OK", 200

    db = get_db()
    cur = db.cursor()

    try:
        if tipo == "envio":
            print("🔥 INTENTANDO CREAR NOTIFICACION")
            # =========================
            # ENVÍO
            # =========================
            cur.execute("""
                SELECT total, estado, user_id 
                FROM envios 
                WHERE id = %s
            """, (referencia_id,))

            row = cur.fetchone()
            if not row:
                return "OK", 200

            if row["estado"] != "PENDIENTE_PAGO":
                return "OK", 200

            cur.execute("""
                UPDATE envios 
                SET estado = 'EN_CAMINO'
                WHERE id = %s
            """, (referencia_id,))

            # actualizar historial vinculado
            cur.execute("""
                UPDATE historial 
                SET estado = 'EN_CAMINO'
                WHERE envio_id = %s
            """, (referencia_id,))

        else:
            # =========================
            # RETIRO
            # =========================
            cur.execute("""
                SELECT total, estado, user_id 
                FROM historial 
                WHERE id = %s AND tipo = 'retiro'
            """, (referencia_id,))

            row = cur.fetchone()
            if not row:
                return "OK", 200

            if row["estado"] != "PENDIENTE_PAGO":
                return "OK", 200

            cur.execute("""
                UPDATE historial 
                SET estado = 'PAGADO'
                WHERE id = %s
            """, (referencia_id,))

        db.commit()

        # =========================
        # 🔔 NOTIFICACIONES ADMIN
        # =========================

        if tipo == "envio":
            print("🔥 CREANDO NOTIFICACION ADMIN (ENVIO)")
            crear_notificacion_admin(
                titulo="📦 Pago confirmado (envío)",
                mensaje=f"Envío #{referencia_id} listo para procesar",
                tipo="envio",
                referencia_id=referencia_id
            )
        else:
            print("🔥 CREANDO NOTIFICACION ADMIN (RETIRO)")
            crear_notificacion_admin(
                titulo="🏪 Pago confirmado (retiro)",
                mensaje=f"Pedido #{referencia_id} listo para retirar",
                tipo="retiro",
                referencia_id=referencia_id
            )

    except Exception as e:
        db.rollback()
        print("❌ Error webhook:", e)

    finally:
        db.close()

    print(f"✅ Pago confirmado {tipo} #{referencia_id}")
    return "OK", 200



@mp_routes.route("/mp/success")
def mp_success():
    return redirect("https://abr-ts.onrender.com/dashboard.html")




#En producción, exigir validación de firma estricta OBLIGATORIA

def validar_firma_mp(request):
    # 🔥 obtener body
    data = request.get_json(silent=True) or {}

    event_type = (
        request.args.get("type")
        or request.args.get("topic")
        or data.get("type")
    )

    print("EVENT TYPE:", event_type)

    # 🔥 permitir SIEMPRE si no hay secret
    if not current_app.config.get("MP_WEBHOOK_SECRET"):
        print("⚠️ Sin secret → se permite webhook")
        return True

    signature = request.headers.get("x-signature")
    request_id = request.headers.get("x-request-id")

    # 🔥 si faltan headers → permitir (test de MP)
    if not signature or not request_id:
        print("⚠️ Webhook sin firma → permitido (test)")
        return True

    try:
        parts = dict(item.split("=") for item in signature.split(","))

        ts = parts.get("ts")
        v1 = parts.get("v1")

        # 🔥 FIX IMPORTANTE: sacar payment_id también del BODY
        payment_id = (
            request.args.get("data.id")
            or request.args.get("id")
            or data.get("data", {}).get("id")
            or data.get("id")
        )

        if not payment_id:
            print("⚠️ No hay payment_id → permitir")
            return True

        manifest = f"data.id:{payment_id};request-id:{request_id};ts:{ts};"

        generated = hmac.new(
            current_app.config["MP_WEBHOOK_SECRET"].encode(),
            manifest.encode(),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(generated, v1)

    except Exception as e:
        print("❌ Error validando firma:", e)
        return True  # 🔥 nunca bloquear en error
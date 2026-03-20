from flask import Blueprint, request, jsonify, redirect, current_app
from backend.mp.service import create_mp_preference_service
from backend.services.notification_service import notificar_pago_aprobado, crear_notificacion

import hmac
import hashlib

from backend.db import get_db


mp_routes = Blueprint("mp", __name__)


@mp_routes.route("/create_preference", methods=["POST"])
def create_preference():
    data = request.get_json(force=True)
    print("BODY /create_preference:", data)

    # 🔥 soporta ambos formatos (root y metadata)
    metadata = data.get("metadata", {}) or {}

    items = data.get("items", [])

    tipo = data.get("tipo") or metadata.get("tipo")
    referencia_id = (
        data.get("referencia_id")
        or metadata.get("referencia_id")
        or metadata.get("pedido_id")  # fallback por tu implementación actual
    )

    # =========================
    # VALIDACIONES
    # =========================
    if tipo not in ("envio", "retiro"):
        return jsonify({"ok": False, "error": "Tipo inválido"}), 400

    if not referencia_id:
        return jsonify({"ok": False, "error": "Falta referencia_id"}), 400

    if not items:
        return jsonify({"ok": False, "error": "Faltan los items"}), 400

    db = get_db()
    cur = db.cursor()

    if tipo == "envio":
        cur.execute("SELECT id FROM envios WHERE id = %s", (referencia_id,))
        if not cur.fetchone():
            db.close()
            return jsonify({"ok": False, "error": "Envio inexistente"}), 400

    elif tipo == "retiro":
        cur.execute("""
            SELECT id FROM historial
            WHERE id = %s AND tipo = 'retiro'
        """, (referencia_id,))
        if not cur.fetchone():
            db.close()
            return jsonify({"ok": False, "error": "Retiro inexistente"}), 400

    db.close()

    # =========================
    # ARMAR ITEMS PARA MP
    # =========================
    mp_items = []

    for item in items:
        nombre = item.get("title") or item.get("name") or "Producto"

        cantidad = item.get("quantity") or item.get("cantidad") or 1
        precio = item.get("unit_price") or item.get("price") or 0

        cantidad = int(cantidad)
        precio = float(precio)

        if cantidad <= 0 or precio <= 0:
            continue

        mp_items.append({
            "title": nombre,
            "quantity": cantidad,
            "unit_price": precio,
            "currency_id": "ARS"
        })

    if not mp_items:
        return jsonify({"ok": False, "error": "No hay items válidos"}), 400

    # =========================
    # SHIPPING
    # =========================
    shipping_cost = 0

    if tipo == "envio":
        db = get_db()
        cur = db.cursor()

        cur.execute(
            "SELECT valor FROM configuracion WHERE clave = %s",
            ("shipping_cost",)
        )
        row = cur.fetchone()
        db.close()

        if row:
            shipping_cost = float(row["valor"])

    if shipping_cost > 0:
        mp_items.append({
            "title": "Costo de envío",
            "quantity": 1,
            "unit_price": shipping_cost,
            "currency_id": "ARS"
        })

    try:
        pref_id = create_mp_preference_service({
            "items": mp_items,
            "tipo": tipo,
            "referencia_id": referencia_id
        })

        return jsonify({
            "ok": True,
            "preference_id": pref_id
        })

    except Exception as e:
        print("ERROR MP:", e)
        return jsonify({
            "ok": False,
            "error": "Error creando preferencia",
            "exception": str(e)
        }), 500


@mp_routes.route("/mp/webhook", methods=["POST"])
def mp_webhook():
    print("🔥 WEBHOOK RECIBIDO")

    # =========================
    # 🔐 Validar firma solo para pagos
    # =========================
    if not validar_firma_mp(request):
        print("❌ Firma inválida")
        return "Invalid signature", 403

    # =========================
    # 📦 Obtener JSON del webhook
    # =========================
    data = request.get_json(silent=True)
    if not data:
        print("⚠️ Webhook sin JSON")
        return "OK", 200

    topic = request.args.get("topic") or request.args.get("type")
    print(f"📨 Payload recibido (topic={topic}):", data)

    # =========================
    # 💳 Manejar merchant_order (solo log)
    # =========================
    if topic == "merchant_order":
        print("ℹ️ Merchant order recibido, se ignora pago directo")
        return "OK", 200

    # =========================
    # 💳 Manejar payment
    # =========================
    payment_id = data.get("data", {}).get("id")
    if not payment_id:
        print("⚠️ No se encontró payment_id")
        return "OK", 200

    import requests
    mp_token = current_app.config["MP_ACCESS_TOKEN"]

    try:
        r = requests.get(
            f"https://api.mercadopago.com/v1/payments/{payment_id}",
            headers={"Authorization": f"Bearer {mp_token}"},
            timeout=10
        )
        r.raise_for_status()
    except Exception as e:
        print("❌ Error consultando MP:", e)
        return "OK", 200

    pago = r.json()

    if pago.get("status") != "approved":
        print("ℹ️ Pago no aprobado:", pago.get("status"))
        return "OK", 200

    referencia_id = pago.get("metadata", {}).get("referencia_id")
    tipo = pago.get("metadata", {}).get("tipo")
    amount_mp = float(pago.get("transaction_amount", 0))
    email_cliente = pago.get("payer", {}).get("email")

    if not referencia_id or not tipo:
        print("⚠️ Metadata incompleta")
        return "OK", 200

    # =========================
    # 🗄 Buscar pedido en DB
    # =========================
    db = get_db()
    cur = db.cursor()
    try:
        if tipo == "envio":
            cur.execute("SELECT total, estado, user_id FROM envios WHERE id = %s", (referencia_id,))
        elif tipo == "retiro":
            cur.execute("SELECT total, estado, user_id FROM historial WHERE id = %s", (referencia_id,))
        else:
            print("⚠️ Tipo inválido:", tipo)
            return "OK", 200

        row = cur.fetchone()
        if not row:
            print("⚠️ Pedido no encontrado")
            return "OK", 200

        total_db = float(row["total"])
        if round(total_db, 2) != round(amount_mp, 2):
            print("⚠️ Monto no coincide")
            return "OK", 200

        if row["estado"] in ("EN_CAMINO", "PAGADO"):
            print("ℹ️ Pedido ya procesado")
            return "OK", 200

        usuario_id = row["user_id"]

        # =========================
        # ✅ Actualizar estado
        # =========================
        if tipo == "envio":
            nuevo_estado = "EN_CAMINO"
            cur.execute("UPDATE envios SET estado = %s WHERE id = %s", (nuevo_estado, referencia_id))
            mensaje_usuario = f"Tu pedido #{referencia_id} fue confirmado y está en preparación."
        else:
            nuevo_estado = "PAGADO"
            cur.execute("UPDATE historial SET estado = %s WHERE id = %s", (nuevo_estado, referencia_id))
            mensaje_usuario = f"Tu retiro #{referencia_id} fue confirmado y ya podés pasar a buscarlo."

        db.commit()
    except Exception as e:
        db.rollback()
        print("❌ Error DB:", e)
        return "OK", 200
    finally:
        db.close()

    print(f"✅ Pago validado correctamente para {tipo} #{referencia_id}")

    # =========================
    # 🔔 Notificaciones y email
    # =========================
    try:
        if usuario_id:
            crear_notificacion(
                usuario_id=usuario_id,
                rol="usuario",
                titulo="Pago confirmado",
                mensaje=mensaje_usuario,
                referencia_id=referencia_id
            )
    except Exception as e:
        print("❌ Error creando notificación usuario:", e)

    try:
        crear_notificacion(
            usuario_id=None,
            rol="admin",
            titulo="Nuevo pedido pagado",
            mensaje=f"{tipo.capitalize()} #{referencia_id} pagado correctamente.",
            referencia_id=referencia_id,
            tipo=tipo
        )
    except Exception as e:
        print("❌ Error creando notificación admin:", e)

    try:
        if email_cliente:
            notificar_pago_aprobado(email_cliente, referencia_id)
    except Exception as e:
        print("❌ Error enviando email:", e)

    return "OK", 200



@mp_routes.route("/mp/success")
def mp_success():
    return redirect("http://127.0.0.1:5500/dashboard.html")




# TODO: En producción, exigir validación de firma estricta OBLIGATORIA

def validar_firma_mp(request):
    print("🔍 Iniciando validación de firma")

    event_type = request.args.get("type") or request.args.get("topic")
    print("Tipo de evento recibido:", event_type)

    if event_type != "payment":
        print("ℹ️ Evento no es 'payment', se omite validación")
        return True

    signature = request.headers.get("x-signature")
    request_id = request.headers.get("x-request-id")
    secret = current_app.config.get("MP_WEBHOOK_SECRET")

    print("x-signature header:", signature)
    print("x-request-id header:", request_id)
    print("Secret cargado:", secret)

    if not signature or not request_id or not secret:
        print("⚠️ Faltan datos para validar firma (sandbox posible)")
        return True  # 🔹 Omitimos la firma solo en sandbox

    try:
        parts = {}
        try:
            parts = dict(item.split("=") for item in signature.split(","))
            print("Partes parseadas de x-signature:", parts)
        except Exception as e:
            print("❌ Error parseando signature:", e)

        ts = parts.get("ts")
        v1 = parts.get("v1")
        print("Timestamp ts:", ts)
        print("Hash v1 recibido:", v1)

        if not ts or not v1:
            print("⚠️ Firma mal formada, no hay ts o v1")
            return True  # 🔹 Sandbox o error de MP

        payment_id = request.args.get("data.id") or request.args.get("id")
        print("Payment ID tomado de args:", payment_id)

        if not payment_id:
            print("⚠️ No vino payment ID en los args")
            return True
        if "data.id" in request.args:
            key_name = "data.id"
            payment_id = request.args.get("data.id")
        elif "id" in request.args:
            key_name = "id"
            payment_id = request.args.get("id")
        else:
            return True



        manifest = f"{key_name}:{payment_id};request-id:{request_id};ts:{ts};"
        print("Manifest RAW repr:", repr(manifest))
        print("Manifest a hashear:", manifest)

        generated = hmac.new(
            secret.strip().encode(),
            manifest.encode(),
            hashlib.sha256
        ).hexdigest()

        print("Hash generado:", generated)

        if not hmac.compare_digest(generated, v1):
            print("❌ Hash no coincide")
            return False

        print("✅ Firma válida")
        return True

    except Exception as e:
        print("❌ Error validando firma:", e)
        return False
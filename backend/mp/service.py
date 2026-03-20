import mercadopago
from backend.config import MP_NOTIFICATION_URL
from flask import current_app
from backend.mp.orders_service import validar_referencia


class MPServiceError(Exception):
    pass


def create_mp_preference_service(data):
    mp_sdk = mercadopago.SDK(current_app.config["MP_ACCESS_TOKEN"])
    items = data.get("items", [])
    tipo = data.get("tipo")
    referencia_id = data.get("referencia_id")

    if tipo not in ("envio", "retiro"):
        raise MPServiceError("Tipo inválido")

    if not validar_referencia(tipo, referencia_id):
        raise MPServiceError("Referencia inválida")

    mp_items = []

    for item in items:
        try:
            quantity = int(item["quantity"])
            price = float(item["unit_price"])

            if quantity <= 0 or price <= 0:
                continue

            mp_items.append({
                "title": item.get("title", "Producto"),
                "quantity": quantity,
                "unit_price": price,
                "currency_id": "ARS"
            })
        except (KeyError, ValueError, TypeError):
            continue

    if not mp_items:
        raise MPServiceError("Items inválidos")

    preference_data = {
        "items": mp_items,
        "metadata": {
            "tipo": tipo,
            "referencia_id": referencia_id
        },
        "notification_url": MP_NOTIFICATION_URL,
        "back_urls": {
            "success": "https://untrustful-jose-unsoarable.ngrok-free.dev/gracias.html",
            "failure": "https://untrustful-jose-unsoarable.ngrok-free.dev/error.html",
            "pending": "https://untrustful-jose-unsoarable.ngrok-free.dev/pendiente.html"
        },
        "auto_return": "approved"
    }

    pref = mp_sdk.preference().create(preference_data)
    print("MP RAW RESPONSE:", pref)
    pref_id = pref.get("response", {}).get("id")

    if not pref_id:
        raise MPServiceError("MP no devolvió preference_id")

    return pref_id

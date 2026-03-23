from flask import Blueprint, request, jsonify, session
from datetime import datetime
from zoneinfo import ZoneInfo
import json
from decimal import Decimal

from backend.db import get_db

purchase_bp = Blueprint("purchase", __name__)


# -------------------------------------------------
# COMPRAS
# -------------------------------------------------
@purchase_bp.route("/purchase", methods=["POST"])
def purchase():
    if "user_id" not in session:
        return jsonify({"error": "No autenticado"}), 401

    data = request.json or {}

    tipo = data.get("tipo")  # "envio" o "retiro"
    if tipo not in ["envio", "retiro"]:
        return jsonify({"error": "Tipo inválido"}), 400

    items = data.get("productos") or data.get("items") or []

    if not items:
        return jsonify({"error": "No hay productos"}), 400

    # -------------------------
    # CALCULAR TOTAL
    # -------------------------
    subtotal = 0

    for p in items:
        try:
            price = float(p.get("price") or 0)
            cantidad = int(p.get("cantidad") or 1)
            subtotal += price * cantidad
        except:
            return jsonify({"error": "Producto inválido"}), 400

    envio_cost = 0

    if tipo == "envio":
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT valor FROM configuracion WHERE clave = 'shipping_cost'")
        row = cur.fetchone()
        envio_cost = float(row["valor"]) if row else 0
        conn.close()

    total = subtotal + envio_cost

    fecha = datetime.now(ZoneInfo("America/Argentina/Buenos_Aires"))

    # -------------------------
    # DATOS EXTRA
    # -------------------------
    cliente = {}

    if tipo == "envio":
        campos = ["nombre", "telefono", "calle", "numero", "ciudad", "provincia", "cp"]

        for c in campos:
            if not data.get(c):
                return jsonify({"error": f"Falta {c}"}), 400

        cliente = {
            "nombre": data.get("nombre"),
            "telefono": data.get("telefono"),
            "email": data.get("email"),
            "direccion": {
                "calle": data.get("calle"),
                "numero": data.get("numero"),
                "piso": data.get("piso"),
                "barrio": data.get("barrio"),
                "ciudad": data.get("ciudad"),
                "provincia": data.get("provincia"),
                "cp": data.get("cp"),
            },
            "notas": data.get("notas")
        }

    elif tipo == "retiro":
        cliente = data.get("cliente", {})

# -------------------------
# INSERT
# -------------------------
    conn = get_db()
    cur = conn.cursor()

    envio_id = None

    if tipo == "envio":
        # 1. guardar en tabla envios
        cur.execute("""
            INSERT INTO envios (
                fecha, total, estado,
                nombre, telefono, email,
                calle, numero, piso, barrio,
                ciudad, provincia, cp, notas,
                productos
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
        """, (
            fecha,
            total,
            "PENDIENTE_PAGO",
            data.get("nombre"),
            data.get("telefono"),
            data.get("email"),
            data.get("calle"),
            data.get("numero"),
            data.get("piso"),
            data.get("barrio"),
            data.get("ciudad"),
            data.get("provincia"),
            data.get("cp"),
            data.get("notas"),
            json.dumps(items, ensure_ascii=False)
        ))

        envio_id = cur.fetchone()["id"]

    # 2. guardar en historial (SIEMPRE)
    cur.execute("""
        INSERT INTO historial (
            user_id, tipo, items, subtotal, envio, total,
            estado, cliente, fecha, envio_id
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        RETURNING id
    """, (
        session["user_id"],
        tipo,
        json.dumps(items, ensure_ascii=False),
        subtotal,
        envio_cost,
        total,
        "PENDIENTE_PAGO",
        json.dumps(cliente, ensure_ascii=False),
        fecha,
        envio_id 
    ))

    pedido_id = cur.fetchone()["id"]

    conn.commit()
    conn.close()

    return jsonify({
        "ok": True,
        "pedido_id": pedido_id,
        "envio_id": envio_id
    }), 200
# -------------------------------------------------
# HISTORIAL
# -------------------------------------------------
@purchase_bp.route("/purchase/history", methods=["GET"])
def purchase_history():
    if "user_id" not in session:
        return jsonify([])

    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT *,
        TO_CHAR(fecha AT TIME ZONE 'America/Argentina/Buenos_Aires',
        'YYYY-MM-DD HH24:MI') as fecha_formateada
        FROM historial
        WHERE user_id = %s
        ORDER BY fecha DESC
    """, (session["user_id"],))

    rows = cur.fetchall()
    db.close()

    data = []

    for r in rows:
        try:
            items = json.loads(r["items"]) if r["items"] else []
        except:
            items = []

        try:
            cliente = json.loads(r["cliente"]) if r["cliente"] else {}
        except:
            cliente = {}

        data.append({
            "id": r["id"],
            "tipo": r["tipo"],
            "envio_id": r["envio_id"],
            "fecha": r["fecha_formateada"],
            "productos": items,
            "subtotal": r["subtotal"],
            "envio": r["envio"],
            "total": r["total"],
            "estado": r["estado"],
            "cliente": cliente
        })

    return jsonify(data)


@purchase_bp.route("/pedido/<int:pedido_id>", methods=["GET"])
def detalle_pedido(pedido_id):
    if "user_id" not in session:
        return jsonify({"error": "No autorizado"}), 401

    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT *,
        TO_CHAR(fecha AT TIME ZONE 'America/Argentina/Buenos_Aires',
        'YYYY-MM-DD HH24:MI') as fecha_formateada
        FROM historial
        WHERE id = %s AND user_id = %s
    """, (pedido_id, session["user_id"]))

    row = cur.fetchone()
    db.close()

    if not row:
        return jsonify({"error": "Pedido no encontrado"}), 404

    return jsonify({
        "id": row["id"],
        "tipo": row["tipo"],
        "fecha": row["fecha_formateada"],
        "estado": row["estado"],
        "total": row["total"],
        "productos": json.loads(row["items"] or "[]"),
        "cliente": json.loads(row["cliente"] or "{}")
    })

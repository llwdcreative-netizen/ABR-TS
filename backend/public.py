from flask import (
    Blueprint, render_template, request,
    jsonify, session, redirect, url_for
)
from backend.db import get_db

public_bp = Blueprint("public", __name__)


@public_bp.route("/")
def index():
    db = get_db()
    productos = db.execute("""
        SELECT * FROM productos WHERE activo = TRUE
    """).fetchall()
    db.close()
    return render_template("index.html", productos=productos)

@public_bp.route("/productos")
def productos_page():
    categoria = request.args.get("categoria")

    db = get_db()
    cur = db.cursor()

    if categoria:
        cur.execute("""
            SELECT p.*
            FROM productos p
            JOIN categorias c ON p.categoria_id = c.id
            WHERE LOWER(c.nombre) = %s
        """, (categoria.lower(),))
    else:
        cur.execute("SELECT * FROM productos")

    productos = cur.fetchall()
    db.close()

    print("CATEGORIA:", categoria)
    print("PRODUCTOS:", productos)

    return render_template("productos.html", productos=productos)

@public_bp.route("/faq")
def faq():
    return render_template("FAQ.html")

@public_bp.route("/help")
def help():
    return render_template("help.html")

@public_bp.route("/turnos")
def turnos_page():
    return render_template("turnos.html")

@public_bp.route("/mispedidos")
def mispedidos():
    return render_template("mis-pedidos.html")


@public_bp.route("/login", methods=["GET"])
def login_page():
    return render_template("login.html")

@public_bp.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect(url_for("auth.login"))

    return render_template("dashboard.html")


@public_bp.route("/producto/<int:id>")
def producto_detalle(id):
    return render_template("detail.html")  # o detail.html

@public_bp.route("/mipedido")
def ver_pedido():
    pedido_id = request.args.get("id")
    tipo = request.args.get("tipo", "envio")

    if not pedido_id:
        return "ID de pedido faltante", 400

    # Podés pasar variables al HTML si querés
    return render_template("mipedido.html", pedido_id=pedido_id, tipo=tipo)

@public_bp.route("/envios/mis-pedidos", methods=["GET"])
def mis_envios():
    if "user_id" not in session:
        return jsonify([])

    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT id, total, estado,
        TO_CHAR(fecha AT TIME ZONE 'America/Argentina/Buenos_Aires',
        'YYYY-MM-DD HH24:MI') as fecha
        FROM envios
        WHERE user_id = %s
        ORDER BY fecha DESC
    """, (session["user_id"],))

    pedidos = [dict(row) for row in cur.fetchall()]
    db.close()

    return jsonify(pedidos)

@public_bp.route("/favoritos")
def favoritos_page():
    return render_template("favoritos.html")


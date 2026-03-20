from flask import Blueprint, render_template, session, redirect, request, url_for
from backend.admin.decorators import admin_required
from backend.db import get_db

admin_pages = Blueprint("admin_pages", __name__)

@admin_pages.route("/admin")
def admin_panel():
    if not session.get("is_admin"):
        return redirect("/admin/login")  # ✅ apunta a la ruta Flask
    return render_template("admin/admin-panel.html")

@admin_pages.route("/admin/login", methods=["GET"])
def admin_login_page():
    return render_template("admin/admin-login.html")


@admin_pages.route("/admin/help")
@admin_required
def admin_help_html():
    return render_template("admin/admin-help.html")

@admin_pages.route("/admin/help/<int:msg_id>")
@admin_required
def admin_help_detalle(msg_id):
    return render_template("admin/help-detail.html", msg_id=msg_id)

@admin_pages.route("/admin/envios")
@admin_required
def admin_envios():
    return render_template("admin/envios.html")

from flask import render_template

@admin_pages.route("/admin/envio/<int:envio_id>")
@admin_required
def admin_envio_page(envio_id):
    return render_template("admin/datos-envio.html")

@admin_pages.route("/admin/retiros")
@admin_required
def admin_retiros():
    return render_template("admin/retiros.html")

@admin_pages.route("/admin/retiro/<int:retiro_id>")
@admin_required
def admin_retiro_page(retiro_id):
    return render_template("admin/datos-retiro.html")


@admin_pages.route("/admin/estados")
@admin_required
def admin_estados():
    return render_template("admin/estados.html")

@admin_pages.route("/admin/producto-form", methods=["GET", "POST"])
def admin_producto_form():
    # 🔒 Verificar que sea admin
    if not session.get("is_admin"):
        return redirect("/admin/login")

    if request.method == "POST":
        # Obtener datos del formulario
        nombre = request.form.get("nombre")
        descripcion = request.form.get("descripcion")
        precio = request.form.get("precio")
        stock = request.form.get("stock") or 0
        imagen = request.form.get("imagen")

        # Validaciones básicas
        if not nombre or not precio:
            return "Nombre y precio son obligatorios", 400

        try:
            precio = float(precio)
            stock = int(stock)
        except ValueError:
            return "Precio o stock inválidos", 400

        # Guardar en DB
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO productos (nombre, descripcion, precio, stock, imagen)
            VALUES (%s, %s, %s, %s, %s)
        """, (nombre, descripcion, precio, stock, imagen))
        conn.commit()
        conn.close()

        return redirect(url_for("admin_pages.admin_producto_form"))  # redirige a mismo form o a lista de productos

    # GET → mostrar formulario
    return render_template("admin/producto_form.html")


@admin_pages.route("/admin/turnos")
@admin_required
def admin_turnos_page():
    return render_template("admin/datos-turnos.html")





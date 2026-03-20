from flask import Blueprint, request, jsonify, session
from werkzeug.security import check_password_hash
from backend.db import get_db
from backend.admin.decorators import admin_required

admin_auth = Blueprint("admin_auth", __name__)


@admin_auth.route("/admin/login", methods=["POST"])
def admin_login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"ok": False, "error": "Datos incompletos"}), 400

    db = get_db()
    cur = db.cursor()

    cur.execute("SELECT id, password_hash FROM admins WHERE email = %s AND activo = TRUE", (email,))
    admin = cur.fetchone()

    if not admin or not check_password_hash(admin["password_hash"], password):
        return jsonify({"ok": False, "error": "Credenciales inválidas"}), 401

# 🔐 sesión
    session.clear()
    session["user_id"] = admin["id"]   # opcional pero recomendable unificar
    session["rol"] = "admin"           # 🔥 CLAVE


    return jsonify({"ok": True})

@admin_auth.route("/admin/logout", methods=["POST"])
def admin_logout():
    session.clear()
    return jsonify({"ok": True})

@admin_auth.route("/admin/panel")
@admin_required
def adminpanel():
    return jsonify({"ok": True, "msg": "Bienvenido al panel admin"})
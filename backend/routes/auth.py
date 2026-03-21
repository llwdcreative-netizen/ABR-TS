from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from backend.db import get_db
from datetime import datetime

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    email = data.get("email")
    password = data.get("password")
    nombre = data.get("nombre")

    if not email or not password or not nombre:
        return jsonify({"error": "Faltan campos"}), 400

    db = get_db()
    cur = db.cursor()

    cur.execute("SELECT * FROM users WHERE email = %s", (email,))
    if cur.fetchone():
        db.close()
        return jsonify({"error": "El usuario ya existe"}), 400

    hashed = generate_password_hash(password)

    cur.execute(
        "INSERT INTO users (email, password, nombre) VALUES (%s, %s, %s) RETURNING id",
        (email, hashed, nombre)
    )

    user_id = cur.fetchone()["id"]

    session.permanent = True
    session["user_id"] = user_id

    db.commit()
    db.close()

    return jsonify({"message": "Usuario registrado"}), 201


@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    db = get_db()
    cur = db.cursor()

    cur.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    db.close()

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    if not check_password_hash(user["password"], password):
        return jsonify({"error": "Contraseña incorrecta"}), 401

    session.permanent = True
    session["user_id"] = user["id"]

    return jsonify({
        "ok": True,
        "redirect": "/dashboard"
    })
    
    
@auth_bp.route("/me", methods=["GET"])
def me():
    if "user_id" not in session:
        return jsonify({"logged": False})

    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT id, nombre, email FROM users WHERE id = %s", (session["user_id"],))
    user = cur.fetchone()
    db.close()

    if not user:
        session.clear()
        return jsonify({"logged": False})

    return jsonify({
        "logged": True,
        "email": user["email"],
        "nombre": user["nombre"]
    })
    
@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logout ok"})

@auth_bp.route("/contact", methods=["POST"])
def contact():
    try:
        data = request.json or {}

        required = ["nombre", "apellido", "email", "mensaje"]
        if any(not data.get(k) for k in required):
            return jsonify({"error": "Faltan campos obligatorios"}), 400

        db = get_db()
        cur = db.cursor()

        # Insertar mensaje
        cur.execute("""
            INSERT INTO help_messages (nombre, apellido, email, telefono, mensaje)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (
            data["nombre"],
            data["apellido"],
            data["email"],
            data.get("telefono"),
            data["mensaje"],
        ))

        msg_id = cur.fetchone()["id"]

        cur.execute("""
            INSERT INTO notificaciones
            (usuario_id, rol, titulo, mensaje, tipo, leida, referencia_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            None,
            "admin",
            "Nuevo mensaje de contacto",
            f"{data['nombre']} {data['apellido']} envió un mensaje",
            "contact",
            False,
            msg_id
        ))

        db.commit()
        db.close()

        return jsonify({"message": "Mensaje enviado"}), 200

    except Exception as e:
        print("Error en /contact:", e)
        return jsonify({"error": "Ocurrió un problema al enviar el mensaje"}), 500


# --------- SISTEMA DE TURNOS ------------
@auth_bp.route("/api/turnos/horarios")
def obtener_horarios():
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT hora
        FROM horarios_turnos
        WHERE activo = TRUE
        ORDER BY hora
    """)

    horarios = [r["hora"] for r in cur.fetchall()]

    db.close()

    return jsonify(horarios)



@auth_bp.route("/api/turnos", methods=["POST"])
def crear_turno():

    data = request.json
    hora = data.get("hora") or data.get("horario")

    if not hora:
        return jsonify({"error": "Horario faltante"}), 400

    db = get_db()
    cur = db.cursor()

    dispositivo = data.get("dispositivo")

    marca = None
    modelo = None

    if dispositivo and " - " in dispositivo:
        marca, modelo = dispositivo.split(" - ", 1)

    # Obtener id de marca
    marca_id = None
    if marca:
        cur.execute(
            "SELECT id FROM marcas WHERE nombre = %s",
            (marca,)
        )

        m = cur.fetchone()
        if m:
            marca_id = m["id"]

    cur.execute("""
        INSERT INTO turnos (
            fecha,
            hora,
            nombre,
            dni,
            email,
            whatsapp,
            marca_id,
            modelo,
            tipo_reparacion,
            descripcion
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        data["fecha"],
        hora,
        data["nombre"],
        data["dni"],
        data["email"],
        data["whatsapp"],
        marca_id,
        modelo,
        data["tipo_reparacion"],
        data["descripcion"]
    ))

    db.commit()
    db.close()

    return jsonify({"ok": True})

#------------- SISTEMA DE FAVORITOS --------------
@auth_bp.route("/api/favoritos/toggle", methods=["POST"])
def toggle_favorito():

    data = request.json
    producto_id = data.get("producto_id")
    user_id = session["user_id"]

    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT id FROM favoritos
        WHERE user_id = %s AND producto_id = %s
    """, (user_id, producto_id))

    fav = cur.fetchone()

    if fav:
        cur.execute("""
            DELETE FROM favoritos
            WHERE user_id = %s AND producto_id = %s
        """, (user_id, producto_id))
        estado = False
    else:
        cur.execute("""
            INSERT INTO favoritos (user_id, producto_id)
            VALUES (%s,%s)
        """, (user_id, producto_id))
        estado = True

    db.commit()
    db.close()

    return jsonify({"favorito": estado})

@auth_bp.route("/api/favoritos")
def ver_favoritos():

    user_id = session["user_id"]

    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT p.*
        FROM favoritos f
        JOIN productos p ON p.id = f.producto_id
        WHERE f.user_id = %s
    """,(user_id,))

    productos = [dict(row) for row in cur.fetchall()]

    db.close()

    return jsonify(productos)

@auth_bp.route("/api/favoritos/preview")
def favoritos_preview():

    user_id = session["user_id"]

    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT p.*
        FROM favoritos f
        JOIN productos p ON p.id = f.producto_id
        WHERE f.user_id = %s
        ORDER BY f.fecha DESC
        LIMIT 5
    """, (user_id,))

    productos = [dict(row) for row in cur.fetchall()]

    db.close()

    return jsonify(productos)




@auth_bp.route("/notificaciones/usuario/limpiar", methods=["DELETE"])
def limpiar_notificaciones_usuario():
    if "user_id" not in session:
        return jsonify({"error": "No autorizado"}), 401

    db = get_db()
    cur = db.cursor()

    cur.execute("""
        DELETE FROM notificaciones
        WHERE usuario_id = %s
    """, (session["user_id"],))

    db.commit()
    db.close()

    return jsonify({"success": True})

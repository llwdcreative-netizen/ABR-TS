from flask import request, jsonify, Blueprint, jsonify, redirect, session,current_app
import json
from backend.db import get_db
from backend.admin.decorators import admin_required
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from backend.services.catalog_utils import (load_product_catalog,
is_available)
from backend.services.notification_service import (crear_notificacion)
from werkzeug.utils import secure_filename
import uuid
import os
from collections import defaultdict


admin_api_bp = Blueprint("admin_api", __name__)

#----------- PEDIDOS -------------
@admin_api_bp.route("/admin/api/pedidos")
@admin_required
def admin_pedidos():
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT id, tipo, total, estado, cliente, envio_id,
        TO_CHAR(fecha AT TIME ZONE 'America/Argentina/Buenos_Aires',
        'YYYY-MM-DD HH24:MI') as fecha
        FROM historial
        ORDER BY fecha DESC
    """)

    rows = cur.fetchall()
    db.close()

    data = []

    for r in rows:
        try:
            cliente = json.loads(r["cliente"]) if r["cliente"] else {}
            nombre = cliente.get("nombre", "—")
        except:
            nombre = "—"

        data.append({
            "id": r["id"],
            "tipo": r["tipo"],
            "fecha": r["fecha"],
            "total": r["total"],
            "estado": r["estado"],
            "nombre": nombre,
            "envio_id": r.get("envio_id")  # 🔥 nuevo
        })

    return jsonify(data)


@admin_api_bp.route("/admin/api/envios/<int:envio_id>")
@admin_required
def admin_envio_api(envio_id):
    db = get_db()
    cur = db.cursor()

    cur.execute("SELECT * FROM envios WHERE id = %s", (envio_id,))
    row = cur.fetchone()
    db.close()

    if not row:
        return jsonify({"error": "Pedido no encontrado"}), 404

    return jsonify({
        "id": row["id"],
        "fecha": row["fecha"],
        "total": row["total"],
        "estado": row["estado"],
        "nombre": row["nombre"],
        "telefono": row["telefono"],
        "email": row["email"],
        "calle": row["calle"],
        "numero": row["numero"],
        "piso": row["piso"],
        "barrio": row["barrio"],
        "ciudad": row["ciudad"],
        "provincia": row["provincia"],
        "cp": row["cp"],
        "notas": row["notas"],
        "productos": json.loads(row["productos"] or "[]")
    })
    

@admin_api_bp.route("/admin/api/retiros/<int:retiro_id>", methods=["GET"])
@admin_required
def admin_detalle_retiro(retiro_id):
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT id, total, estado, items, cliente,
        TO_CHAR(fecha AT TIME ZONE 'America/Argentina/Buenos_Aires',
        'YYYY-MM-DD HH24:MI') as fecha
        FROM historial
        WHERE id = %s AND tipo = 'retiro'
    """, (retiro_id,))

    row = cur.fetchone()
    db.close()

    if not row:
        return jsonify({"error": "Pedido no encontrado"}), 404

    try:
        productos = json.loads(row["items"]) if row["items"] else []
    except:
        productos = []

    return jsonify({
        "id": row["id"],
        "fecha": row["fecha"],
        "total": row["total"],
        "estado": row["estado"],
        "cliente": row["cliente"],
        "productos": productos
    })

#------------ HELP --------------

@admin_api_bp.route("/admin/api/help")
@admin_required
def admin_help_api():
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT id, nombre, apellido, email,
        TO_CHAR(fecha AT TIME ZONE 'America/Argentina/Buenos_Aires',
        'YYYY-MM-DD HH24:MI') as fecha
        FROM help_messages
        ORDER BY id DESC
    """)

    rows = cur.fetchall()
    db.close()

    return jsonify([dict(r) for r in rows])


@admin_api_bp.route("/admin/api/help/<int:msg_id>")
@admin_required
def admin_help_detalle_api(msg_id):
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT *
        FROM help_messages
        WHERE id = %s
    """, (msg_id,))

    row = cur.fetchone()

    if not row:
        db.close()
        return jsonify({"error": "Mensaje no encontrado"}), 404

    # 🔥 Marcar notificación como leída
    cur.execute("""
        UPDATE notificaciones
        SET leida = TRUE
        WHERE referencia_id = %s
        AND tipo = 'contact'
        AND rol = 'admin'
    """, (msg_id,))

    db.commit()
    db.close()

    return jsonify(dict(row))



#--------- ESTADOS ------------

@admin_api_bp.route("/admin/pedidos/<int:pedido_id>/estado", methods=["POST"])
@admin_required
def cambiar_estado_pedido(pedido_id):
    nuevo_estado = request.json.get("estado")

    estados_validos = [
        "PENDIENTE_PAGO",
        "PENDIENTE",
        "EN_CAMINO",
        "LISTO_PARA_RETIRAR",
        "ENTREGADO",
        "RETIRADO",
        "CANCELADO"
    ]

    if nuevo_estado not in estados_validos:
        return jsonify({"error": "Estado inválido"}), 400

    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT user_id, tipo, envio_id
        FROM historial
        WHERE id = %s
    """, (pedido_id,))
    row = cur.fetchone()

    if not row:
        db.close()
        return jsonify({"error": "Pedido no encontrado"}), 404

    # 🔥 actualizar historial
    cur.execute("""
        UPDATE historial
        SET estado = %s
        WHERE id = %s
    """, (nuevo_estado, pedido_id))

    # 🔥 si es envío, actualizar también envios
    if row["tipo"] == "envio" and row["envio_id"]:
        cur.execute("""
            UPDATE envios
            SET estado = %s
            WHERE id = %s
        """, (nuevo_estado, row["envio_id"]))

    db.commit()
    db.close()

    crear_notificacion(
        usuario_id=row["user_id"],
        rol="usuario",
        titulo="Actualización de pedido",
        mensaje=f"Tu pedido #{pedido_id} ahora está: {nuevo_estado.replace('_',' ')}",
        referencia_id=pedido_id,
        tipo=row["tipo"]
    )

    return jsonify({"ok": True})




#------------- ESTADISTICAS ------------

@admin_api_bp.route("/admin/api/estadisticas/pedidos")
@admin_required
def admin_estadisticas_pedidos():
    db = get_db()
    cur = db.cursor()

    cur.execute("""
    SELECT
        COUNT(*) FILTER (
            WHERE estado IN ('ENTREGADO','RETIRADO')
        ) AS completados,

        COUNT(*) FILTER (
            WHERE estado NOT IN ('ENTREGADO','RETIRADO','CANCELADO')
        ) AS pendientes
    FROM historial
    """)

    row = cur.fetchone()
    db.close()

    print(row)
    return jsonify({
        "completados": row["completados"] or 0,
        "pendientes": row["pendientes"] or 0
    })



@admin_api_bp.route("/admin/api/estadisticas/retiros")
@admin_required
def estadisticas_retiros():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            COUNT(*) FILTER (WHERE estado = 'PENDIENTE') AS pendientes,
            COUNT(*) FILTER (WHERE estado = 'LISTO_PARA_RETIRAR') AS listos,
            COUNT(*) FILTER (WHERE estado = 'RETIRADO') AS retirados
        FROM historial
        WHERE tipo = 'retiro'
    """)

    row = cur.fetchone()
    conn.close()

    return jsonify({
        "pendientes": row["pendientes"] or 0,
        "listos": row["listos"] or 0,
        "retirados": row["retirados"] or 0
    })

@admin_api_bp.route("/admin/api/estadisticas/tipos")
@admin_required
def estadisticas_tipos():
    conn = get_db()
    cur = conn.cursor()

    # contar envíos reales
    cur.execute("SELECT COUNT(*) AS total FROM envios")
    envios = cur.fetchone()["total"]

    # contar retiros reales
    cur.execute("SELECT COUNT(*) AS total FROM historial WHERE tipo = 'retiro'")
    retiros = cur.fetchone()["total"]

    conn.close()

    return jsonify({
        "envios": envios or 0,
        "retiros": retiros or 0
    })

@admin_api_bp.route("/admin/api/estadisticas/total-dia")
@admin_required
def total_generado_hoy():
    conn = get_db()
    cur = conn.cursor()

    tz = ZoneInfo("America/Argentina/Buenos_Aires")
    ahora = datetime.now(tz)

    inicio = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
    fin = inicio + timedelta(days=1)

    cur.execute("""
        SELECT COALESCE(SUM(total), 0) AS total
        FROM historial
        WHERE fecha >= %s
        AND fecha < %s
        AND estado != 'CANCELADO'
    """, (inicio, fin))

    total = cur.fetchone()["total"]
    conn.close()

    return jsonify({
        "total_dia": round(float(total), 2)
    })
    

# -------------- PRODUCTOS ----------------------------

@admin_api_bp.route("/products", methods=["GET"])
def get_products():
    catalogo = load_product_catalog()

    disponibles = []
    for p in catalogo.values():
        if is_available(p):
            disponibles.append(p)

    return jsonify(disponibles)

@admin_api_bp.route("/api/productos")
def api_productos():
    marca_id = request.args.get("marca")
    categoria = request.args.get("categoria")

    db = get_db()
    cur = db.cursor()

    query = """
        SELECT 
            p.id, 
            p.nombre, 
            p.descripcion, 
            p.precio,
            p.stock, 
            p.imagen,
            c.nombre AS categoria,
            m.nombre AS marca
        FROM productos p
        LEFT JOIN marcas m ON p.marca_id = m.id
        LEFT JOIN categorias c ON p.categoria_id = c.id
        WHERE p.activo = TRUE
    """

    params = []

    if marca_id:
        query += " AND p.marca_id = %s"
        params.append(marca_id)

    if categoria:
        query += " AND p.categoria_id   = %s"
        params.append(categoria)

    cur.execute(query, tuple(params))

    productos = [dict(row) for row in cur.fetchall()]
    db.close()

    return jsonify(productos)

@admin_api_bp.route("/admin/productos-json")
@admin_required
def admin_productos_json():
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT 
            p.id, 
            p.nombre, 
            p.descripcion, 
            p.precio,
            p.stock, 
            p.imagen, 
            p.activo,
            p.marca_id,
            p.categoria_id,
            c.nombre AS categoria,
            m.nombre AS marca
        FROM productos p
        LEFT JOIN marcas m ON p.marca_id = m.id
        LEFT JOIN categorias c ON p.categoria_id = c.id
        ORDER BY p.id DESC
    """)

    productos = [dict(row) for row in cur.fetchall()]
    db.close()

    return jsonify(productos)


@admin_api_bp.route("/api/productos/<int:id>")
def api_producto(id):
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT id, nombre, descripcion, precio, stock, imagen, marca_id
        FROM productos
        WHERE id = %s AND activo = TRUE
    """, (id,))

    producto = cur.fetchone()
    db.close()

    if producto is None:
        return jsonify({"error": "Producto no encontrado"}), 404

    return jsonify(dict(producto))

@admin_api_bp.route("/api/marcas")
def api_marcas():
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT id, nombre
        FROM marcas
        ORDER BY nombre ASC
    """)

    marcas = [dict(row) for row in cur.fetchall()]
    db.close()

    return jsonify(marcas)

# ------------------- ELIMINAR Y/O EDITAR PRODUCTOS ----------------

@admin_api_bp.route("/admin/productos/<int:id>/editar", methods=["POST"])
@admin_required
def editar_producto(id):
    nombre = request.form["nombre"].strip()
    descripcion = request.form.get("descripcion", "").strip()
    precio = float(request.form["precio"])
    stock = int(request.form.get("stock", 0))
    marca_id = request.form.get("marca_id")
    categoria_id = request.form.get("categoria_id")
    subcategoria_id = request.form.get("subcategoria_id")

    if marca_id:
        marca_id = int(marca_id)
    else:
        # mantener la marca actual
        cur.execute("SELECT marca_id FROM productos WHERE id=%s", (id,))
        marca_id = cur.fetchone()["marca_id"] 

    if categoria_id:
        categoria_id = int(categoria_id)

    archivo = request.files.get("imagen")
    nombre_imagen = None

    db = get_db()
    cur = db.cursor()

    if archivo and archivo.filename:
        filename = secure_filename(archivo.filename)

        if "." not in filename:
            return "Archivo inválido", 400

        ext = filename.rsplit(".", 1)[1].lower()
        nombre_imagen = f"{uuid.uuid4().hex}.{ext}"

        # 🔥 RUTA CORRECTA ABSOLUTA
        upload_folder = os.path.join(current_app.root_path, "static", "uploads")
        os.makedirs(upload_folder, exist_ok=True)

        ruta = os.path.join(upload_folder, nombre_imagen)
        archivo.save(ruta)

        cur.execute("""
            UPDATE productos
            SET nombre=%s, descripcion=%s, precio=%s, stock=%s, imagen=%s, marca_id=%s, categoria_id=%s, subcategoria_id=%s
            WHERE id=%s
        """, (nombre, descripcion, precio, stock, nombre_imagen, marca_id, categoria_id, subcategoria_id, id))
    else:
        cur.execute("""
            UPDATE productos
            SET nombre=%s, descripcion=%s, precio=%s, stock=%s, marca_id=%s, categoria_id=%s, subcategoria_id=%s
            WHERE id=%s
        """, (nombre, descripcion, precio, stock, marca_id, categoria_id, subcategoria_id, id))

    db.commit()
    db.close()

    return jsonify({"ok": True})



@admin_api_bp.route("/admin/productos/<int:id>/eliminar", methods=["POST"])
@admin_required
def eliminar_producto(id):
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        UPDATE productos
        SET activo = FALSE
        WHERE id = %s
    """, (id,))

    db.commit()
    db.close()

    return jsonify({"ok": True})

@admin_api_bp.route("/producto-form", methods=["POST"])
@admin_required
def guardar_producto():
    nombre = request.form["nombre"]
    descripcion = request.form.get("descripcion", "").strip()
    precio = float(request.form["precio"])
    stock = int(request.form.get("stock", 0))
    marca_id = int(request.form["marca_id"])
    categoria_id = request.form.get("categoria_id")
    subcategoria = request.form.get("subcategoria")

    archivo = request.files.get("imagen")
    print("ARCHIVO RECIBIDO:", archivo)
    nombre_imagen = None

    if archivo and archivo.filename:
        filename = secure_filename(archivo.filename)

        if "." not in filename:
            return "Archivo inválido", 400

        ext = filename.rsplit(".", 1)[1].lower()
        nombre_imagen = f"{uuid.uuid4().hex}.{ext}"

        # 🔥 RUTA CORRECTA ABSOLUTA
        upload_folder = os.path.join(current_app.root_path, "static", "uploads")
        os.makedirs(upload_folder, exist_ok=True)

        ruta = os.path.join(upload_folder, nombre_imagen)
        archivo.save(ruta)

    db = get_db()
    cur = db.cursor()
    cur.execute("""
    INSERT INTO productos (
        nombre,
        descripcion,
        precio,
        stock,
        imagen,
        marca_id,
        categoria_id
    )
    VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, (
        nombre,
        descripcion,
        precio,
        stock,
        nombre_imagen,
        marca_id,
        categoria_id
    ))
    db.commit()
    db.close()

    return redirect("/admin/producto-form")


#--------- COSTE DE ENVÍO MODIFICABLE -----------

@admin_api_bp.route("/api/shipping")
def get_shipping():
    db = get_db()
    cur = db.cursor()

    cur.execute("SELECT valor FROM configuracion WHERE clave = 'shipping_cost'")
    row = cur.fetchone()
    db.close()

    if not row:
        return jsonify({"shippingCost": 0})

    return jsonify({"shippingCost": float(row["valor"])})

@admin_api_bp.route("/admin/api/shipping", methods=["POST"])
@admin_required
def update_shipping():
    data = request.json
    nuevo_valor = data.get("shippingCost")

    if nuevo_valor is None:
        return jsonify({"error": "Falta shippingCost"}), 400

    db = get_db()
    cur = db.cursor()

    cur.execute("""
        INSERT INTO configuracion (clave, valor)
        VALUES ('shipping_cost', %s)
        ON CONFLICT(clave)
        DO UPDATE SET valor=excluded.valor
    """, (str(nuevo_valor),))


    db.commit()
    db.close()

    return jsonify({"ok": True})

#------------- NOTIFICACIONES -----------

@admin_api_bp.route("/notificaciones")
def obtener_notificaciones():
    rol = request.args.get("rol")
    
    conn = get_db()
    cur = conn.cursor()

    if rol == "admin":
        cur.execute("""
            SELECT 
                id,
                usuario_id,
                rol,
                titulo,
                mensaje,
                tipo,
                leida,
                referencia_id,
                TO_CHAR(fecha, 'YYYY-MM-DD HH24:MI') as fecha
            FROM notificaciones
            WHERE rol = 'admin'
            ORDER BY fecha DESC
        """)
    else:
        if "user_id" not in session:
            return jsonify([])

        cur.execute("""
            SELECT 
                id,
                usuario_id,
                rol,
                titulo,
                mensaje,
                tipo,
                leida,
                referencia_id,
                TO_CHAR(fecha, 'YYYY-MM-DD HH24:MI') as fecha
            FROM notificaciones
            WHERE usuario_id = %s
            ORDER BY fecha DESC
        """, (session["user_id"],))

    rows = cur.fetchall()
    conn.close()

    return jsonify([dict(r) for r in rows])


@admin_api_bp.route("/notificaciones/marcar-leidas", methods=["POST"])
def marcar_leidas():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        UPDATE notificaciones
        SET leida = TRUE
        WHERE rol = 'admin'
    """)

    conn.commit()
    conn.close()

    return jsonify({"ok": True})

@admin_api_bp.route("/notificaciones/limpiar", methods=["DELETE"])
def limpiar_notificaciones():
    print("SESSION LIMPIAR:", dict(session))
    if not session.get("is_admin"):
        return jsonify({"error": "No autorizado"}), 403

    db = get_db()
    cur = db.cursor()

    cur.execute("DELETE FROM notificaciones WHERE rol = 'admin'")
    db.commit()
    db.close()

    return jsonify({"success": True})





@admin_api_bp.route("/notificaciones/<int:notif_id>/leer", methods=["POST"])
def marcar_notificacion_leida(notif_id):
    if "user_id" not in session:
        return jsonify({"error": "No autorizado"}), 401

    db = get_db()
    cur = db.cursor()

    cur.execute("""
        UPDATE notificaciones
        SET leida = TRUE
        WHERE id = %s
        AND usuario_id = %s
    """, (notif_id, session["user_id"]))

    db.commit()
    db.close()

    return jsonify({"ok": True})

#----------- REVIEWS ------------

@admin_api_bp.route("/api/reviews", methods=["POST"])
def crear_resena():

    print("SESSION:", session)

    if "user_id" not in session:   # 🔥 CAMBIO ACÁ
        return jsonify({"error": "No autorizado"}), 401

    data = request.json
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        INSERT INTO reviews (producto_id, usuario_id, comentario, puntuacion)
        VALUES (%s, %s, %s, %s)
    """, (
        data["producto_id"],
        session["user_id"],   # 🔥 Y ACÁ
        data["comentario"],
        data["puntuacion"]
    ))

    db.commit()
    db.close()

    return jsonify({"mensaje": "Reseña creada"}), 201

# REVIEWS SECCION

@admin_api_bp.route("/api/reviews/<int:producto_id>")
def obtener_resenas(producto_id):
    db = get_db()
    cur = db.cursor()

    # 1️⃣ Obtener reseñas
    cur.execute("""
        SELECT u.nombre, r.comentario, r.puntuacion, r.fecha
        FROM reviews r
        JOIN users u ON r.usuario_id = u.id
        WHERE r.producto_id = %s
        ORDER BY r.fecha DESC
    """, (producto_id,))

    resenas = [dict(row) for row in cur.fetchall()]

    # 2️⃣ Obtener promedio
    cur.execute("""
        SELECT ROUND(AVG(puntuacion), 1) as promedio,
               COUNT(*) as total
        FROM reviews
        WHERE producto_id = %s
    """, (producto_id,))

    rating = cur.fetchone()

    db.close()

    return jsonify({
        "resenas": resenas,
        "rating": {
            "promedio": rating["promedio"] or 0,
            "total": rating["total"] or 0
        }
    })


#------------------ TOP PRODUCTOS MÁS COMPRADOS ----------------------
@admin_api_bp.route("/api/productos/top")
def productos_mas_vendidos():
    db = get_db()
    cur = db.cursor()

    # Traer envíos entregados
    cur.execute("SELECT productos FROM envios WHERE estado = 'ENTREGADO'")
    envios = cur.fetchall()

    # Traer retiros no cancelados
    cur.execute("SELECT items FROM historial WHERE tipo = 'retiro' AND estado != 'CANCELADO'")
    retiros = cur.fetchall()

    contador = defaultdict(int)

    # Contamos ventas usando name si no hay producto_id
    for r in envios + retiros:
        key = "productos" if "productos" in r else "items"
        for p in json.loads(r[key] or "[]"):
            prod_key = p.get("producto_id") or p.get("name")
            contador[prod_key] += p.get("cantidad", 1)

    # Top 5
    top_keys = sorted(contador, key=contador.get, reverse=True)[:5]

    if not top_keys:
        return jsonify([])

    # Traer info de la tabla productos si hay producto_id, sino solo devolver name
    productos = []
    for k in top_keys:
        if isinstance(k, int):  # tiene producto_id
            cur.execute("""
                SELECT p.id, p.nombre, p.descripcion, p.precio, p.imagen, m.nombre AS marca
                FROM productos p
                JOIN marcas m ON p.marca_id = m.id
                WHERE p.id = %s
            """, (k,))
            row = cur.fetchone()
            if row:
                p = dict(row)
                p["cantidad_vendida"] = contador[k]
                productos.append(p)
        else:
            # Buscar producto real por nombre
            cur.execute("""
                SELECT p.id, p.nombre, p.descripcion, p.precio, p.imagen, m.nombre AS marca
                FROM productos p
                JOIN marcas m ON p.marca_id = m.id
                WHERE LOWER(p.nombre) = LOWER(%s)
                LIMIT 1
            """, (k,))

            row = cur.fetchone()

            if row:
                p = dict(row)
                p["cantidad_vendida"] = contador[k]
                productos.append(p)

    db.close()
    return jsonify(productos)

#----------------- SISTEMA DE TURNOS -----------------

@admin_api_bp.route("/admin/api/turnos")
@admin_required
def admin_turnos():

    db = get_db()
    cur = db.cursor()

    cur.execute("""
    SELECT
    t.id,
    t.fecha,
    t.hora,
    t.nombre,
    t.dni,
    t.email,
    t.whatsapp,
    m.nombre AS marca,
    t.modelo,
    t.tipo_reparacion,
    t.descripcion,
    t.estado
    FROM turnos t
    LEFT JOIN marcas m ON t.marca_id = m.id
    ORDER BY t.fecha DESC, t.hora DESC
    """)

    turnos = [dict(row) for row in cur.fetchall()]

    db.close()

    # Formatear fecha
    for t in turnos:
        if t["fecha"]:
            t["fecha"] = t["fecha"].strftime("%d/%m/%Y")

    return jsonify(turnos)

#-------------- CATEGORÍAS --------------

@admin_api_bp.route("/admin/api/categorias", methods=["POST"])
@admin_required
def crear_categoria():
    data = request.json
    nombre = data.get("nombre")

    if not nombre:  # 🔹 validar nombre
        return jsonify({"ok": False, "error": "Nombre requerido"}), 400

    db = get_db()
    cur = db.cursor()

    cur.execute("INSERT INTO categorias (nombre) VALUES (%s)", (nombre,))
    db.commit()
    db.close()

    return jsonify({"ok": True})

@admin_api_bp.route("/admin/api/subcategorias", methods=["POST"])
@admin_required
def crear_subcategoria():
    data = request.json
    nombre = data.get("nombre")
    categoria_id = data.get("categoria_id")

    if not nombre or not categoria_id:
        return jsonify({"ok": False, "error": "Nombre y categoría requeridos"}), 400

    db = get_db()
    cur = db.cursor()
    cur.execute(
        "INSERT INTO subcategorias (nombre, categoria_id) VALUES (%s,%s)",
        (nombre, categoria_id)
    )
    db.commit()
    db.close()

    return jsonify({"ok": True})

@admin_api_bp.route("/api/categorias")
def api_categorias():
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT c.id AS id, c.nombre AS categoria,
               s.id AS sub_id, s.nombre AS subcategoria
        FROM categorias c
        LEFT JOIN subcategorias s ON s.categoria_id = c.id
        ORDER BY c.nombre
    """)
    rows = cur.fetchall()
    db.close()

    categorias = {}

    for r in rows:
        cat = r["categoria"]
        cat_id = r["id"]

        if cat not in categorias:
            categorias[cat] = {"id": cat_id, "subcategorias": []}

        if r["subcategoria"]:
            categorias[cat]["subcategorias"].append(r["subcategoria"])

    resultado = [
        {"categoria": k, "id": v["id"], "subcategorias": v["subcategorias"]}
        for k, v in categorias.items()
    ]

    return jsonify(resultado)
import psycopg
import psycopg.rows
from werkzeug.security import generate_password_hash

ADMIN_EMAIL = "llwd.creative@gmail.com"


def get_db():
    return psycopg.connect(
        host="localhost",
        dbname="postgres",
        user="postgres",
        password="CRAZYNOISEBIZARRETOWN",
        row_factory=psycopg.rows.dict_row
    )


def init_db():
    with get_db() as db:
        with db.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    nombre TEXT NOT NULL
                )
            """)

            # HELP MESSAGES
            cur.execute("""
                CREATE TABLE IF NOT EXISTS help_messages (
                    id SERIAL PRIMARY KEY,
                    nombre TEXT NOT NULL,
                    apellido TEXT NOT NULL,
                    email TEXT NOT NULL,
                    telefono TEXT,
                    fecha TIMESTAMPTZ,
                    mensaje TEXT NOT NULL
                )
            """)


            #SISTEMA DE TURNOS
            cur.execute("""
                CREATE TABLE IF NOT EXISTS turnos (
                    id SERIAL PRIMARY KEY,

                    user_id INTEGER REFERENCES users(id),

                    fecha DATE NOT NULL,
                    hora TEXT NOT NULL,

                    nombre TEXT NOT NULL,
                    dni TEXT,
                    email TEXT,
                    whatsapp TEXT,

                    marca_id INTEGER REFERENCES marcas(id),
                    modelo TEXT,

                    tipo_reparacion TEXT,
                    descripcion TEXT,

                    estado TEXT DEFAULT 'PENDIENTE',

                    fecha_creado TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            #HORARIOS PARA ADMIN
            cur.execute("""
                CREATE TABLE IF NOT EXISTS horarios_turnos (
                    id SERIAL PRIMARY KEY,
                    hora TEXT UNIQUE NOT NULL,
                    activo BOOLEAN DEFAULT TRUE
                )
            """)


                # Historial
            cur.execute("""
                CREATE TABLE IF NOT EXISTS historial (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    tipo TEXT NOT NULL,
                    items TEXT NOT NULL,
                    total REAL NOT NULL,
                    cliente TEXT,
                    fecha TIMESTAMPTZ,
                    subtotal REAL DEFAULT 0,
                    envio REAL DEFAULT 0,
                    estado TEXT DEFAULT 'PENDIENTE'
                )
            """)
            
            # Envíos
            cur.execute("""
                CREATE TABLE IF NOT EXISTS envios (
                    id SERIAL PRIMARY KEY,
                    estado TEXT DEFAULT 'PENDIENTE',
                    user_id INTEGER REFERENCES users(id),
                    metodo_entrega TEXT,
                    nombre TEXT,
                    telefono TEXT,
                    email TEXT,
                    calle TEXT,
                    numero TEXT,
                    piso TEXT,
                    barrio TEXT,
                    ciudad TEXT,
                    provincia TEXT,
                    cp TEXT,
                    notas TEXT,
                    productos TEXT,
                    subtotal REAL DEFAULT 0,
                    envio REAL DEFAULT 0,
                    total REAL,
                    fecha TIMESTAMPTZ
                )
            """)
            
            cur.execute("""
                CREATE TABLE IF NOT EXISTS historial_estados (
                    id SERIAL PRIMARY KEY,
                    envio_id INTEGER,
                    estado TEXT,
                    fecha TIMESTAMPTZ
                )
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS marcas (
                    id SERIAL PRIMARY KEY,
                    nombre VARCHAR(100) UNIQUE NOT NULL
                );
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS productos (
                    id SERIAL PRIMARY KEY,
                    nombre TEXT NOT NULL,
                    descripcion TEXT,
                    precio NUMERIC(10,2) NOT NULL,
                    stock INTEGER DEFAULT 0,
                    imagen TEXT,
                    activo BOOLEAN DEFAULT TRUE,
                    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    marca_id INTEGER REFERENCES marcas(id)
                )
            """)
            # ADMINS
            cur.execute("""
                CREATE TABLE IF NOT EXISTS admins (
                    id SERIAL PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    activo BOOLEAN DEFAULT TRUE
                )
            """)
            
            ADMIN_EMAIL = "llwd.creative@gmail.com"
    
            cur.execute("""
                CREATE TABLE IF NOT EXISTS configuracion (
                    clave TEXT PRIMARY KEY,
                    valor TEXT NOT NULL
            )
        """)

            # Insertar admin si no existe
            cur = db.execute("SELECT id FROM admins WHERE email = %s", (ADMIN_EMAIL,))
            if not cur.fetchone():
                db.execute("""
                    INSERT INTO admins (email, password_hash)
                    VALUES (%s, %s)
                """, (
                    ADMIN_EMAIL,
                    generate_password_hash("7776")
                ))

            # Insertar producto si tabla vacía
            cur = db.execute("SELECT COUNT(*) FROM productos")
            row = cur.fetchone()
            if row["count"] == 0:
                db.execute("""
                    INSERT INTO productos (nombre, descripcion, precio, imagen)
                    VALUES (%s, %s, %s, %s)
                """, (
                    "Pantalla Samsung Galaxy A01",
                    "Pantalla original",
                    10000,
                    "imagen.jpg"
                ))

            cur.execute("""
                CREATE TABLE IF NOT EXISTS notificaciones (
                    id SERIAL PRIMARY KEY,
                    usuario_id INTEGER,
                    rol TEXT, -- 'usuario' o 'admin'
                    titulo TEXT,
                    mensaje TEXT,
                    tipo TEXT,
                    leida BOOLEAN DEFAULT FALSE,
                    referencia_id INTEGER,
                    fecha TIMESTAMPTZ
        )
        """)

            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario
                ON notificaciones (usuario_id)
                """)

            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_notificaciones_leida
                ON notificaciones (leida)
        """)

            cur.execute("""
                INSERT INTO marcas (nombre) VALUES
                    ('Apple'),
                    ('Samsung'),
                    ('Motorola'),
                    ('TCL'),
                    ('Xiaomi'),
                    ('ZTE')
                    ON CONFLICT (nombre) DO NOTHING;
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS categorias (
                id SERIAL PRIMARY KEY,
                nombre TEXT UNIQUE NOT NULL
            );
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS subcategorias (
                id SERIAL PRIMARY KEY,
                nombre TEXT NOT NULL,
                categoria_id INTEGER REFERENCES categorias(id) ON DELETE CASCADE
            );
            """)
            
            
            cur.execute("""
                CREATE TABLE IF NOT EXISTS reviews (
                    id SERIAL PRIMARY KEY,
                    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
                    usuario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    comentario TEXT NOT NULL,
                    puntuacion INTEGER NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
                    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
            """)
            
            cur.execute("""
                CREATE TABLE IF NOT EXISTS favoritos (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
                    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, producto_id)
                    );
            """)

        db.commit()
        db.close()
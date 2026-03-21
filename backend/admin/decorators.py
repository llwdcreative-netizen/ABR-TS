from functools import wraps
from flask import session, redirect, jsonify

# 🔐 Para páginas HTML
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("rol") != "admin":
            return jsonify({"error": "No autorizado"}), 403
        return f(*args, **kwargs)
    return decorated_function

# 🔐 Para APIs (fetch / JSON)
def admin_api_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("rol") != "admin":
            return jsonify({"error": "No autorizado"}), 403
        return f(*args, **kwargs)
    return decorated_function

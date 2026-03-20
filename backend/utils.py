import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# -------------------------------------------------
# CARGA SEGURA DEL CATÁLOGO
# -------------------------------------------------
def load_product_catalog():
    productos_file = BASE_DIR / "productos.json"
    with open(productos_file, "r", encoding="utf-8") as f:
        data = json.load(f)
        return {p["id"]: p for p in data["productos"]}
    
def is_available(producto):
    if not producto.get("activo", True):
        return False

    if producto.get("stock", 0) <= 0:
        return False

    return True
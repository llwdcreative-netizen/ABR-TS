from backend.services.catalog_utils import (load_product_catalog,
is_available)

def get_available_products():
    catalogo = load_product_catalog()
    return [p for p in catalogo.values() if is_available(p)]
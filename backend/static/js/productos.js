let productos = [];

async function cargarProductos() {
  try {
    const res = await fetch("/api/productos");
    if (!res.ok) throw new Error("Error al cargar productos");

    productos = await res.json();

    const contenedor = document.getElementById("productos");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    productos.forEach(p => {
      contenedor.innerHTML += `
        <div class="producto"
            data-id="${p.id}"
            data-nombre="${p.nombre.toLowerCase()}"
            data-categoria="${p.categoria || ""}"
            data-subcategoria="${p.subcategoria || ""}"
            data-marca="${p.marca ? p.marca.toLowerCase() : ""}">
            <img src="${p.imagen ? `/static/uploads/${p.imagen}` : '/static/img/placeholder.png'}" alt="${p.nombre}">
            <div class="info-container">
            <h3>${p.nombre}</h3>
            <p>${p.descripcion}</p>
            <strong>$${p.precio}</strong>
            </div>
        </div>
      `;
    });

    // listeners después de renderizar
    document.querySelectorAll(".producto").forEach(el => {
      el.addEventListener("click", () => {
        const id = el.dataset.id;
        window.location.href = `/producto/${id}`;
      });
    });

    // llamar a filtros solo si existen
    if (document.getElementById("filtros")) generarFiltros();

  } catch (err) {
    console.error(err);
  }
}

cargarProductos();
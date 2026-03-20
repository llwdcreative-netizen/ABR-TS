async function cargarTopProductos() {
  const res = await fetch("/api/productos/top");
  const productos = await res.json();

  const grid = document.getElementById("top-products-df");
  grid.innerHTML = "";

  productos.forEach(p => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
      <div class="badge">Más vendido</div>
      <img class="card-img" src="/static/uploads/${p.imagen}" alt="${p.nombre}">
      <div class="info">
        <h3>${p.nombre}</h3>
        <p class="marca">${p.marca}</p>
        <p class="price">$${parseFloat(p.precio).toFixed(2)}</p>
      </div>
    `;

        // 👉 REDIRECCIÓN
    if (p.id) {
      card.style.cursor = "pointer";
      card.addEventListener("click", () => {
        window.location.href = `/producto/${p.id}`;
      });
    }


    grid.appendChild(card);
  });
}

// Llamar al cargar la página
document.addEventListener("DOMContentLoaded", cargarTopProductos);
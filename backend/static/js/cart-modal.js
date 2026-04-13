document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // CARRITO STORAGE
  // =========================
  function obtenerCarrito() {
    return JSON.parse(localStorage.getItem("carrito")) || [];
  }

  function guardarCarrito(carrito) {
    localStorage.setItem("carrito", JSON.stringify(carrito));
  }

  let carrito = obtenerCarrito();

  // =========================
  // CONTADOR (BACK + FALLBACK)
  // =========================
  async function actualizarCarritoCount() {
    const badge = document.getElementById("cart-count");
    if (!badge) return;

    try {
      const res = await fetch("/api/carrito/count", {
        credentials: "include"
      });

      const data = await res.json();
      const total = data.count || 0;

      if (total > 0) {
        badge.textContent = total;
        badge.style.display = "inline-block";
      } else {
        badge.style.display = "none";
      }

    } catch {
      // fallback local
      const total = carrito.reduce((acc, p) => acc + (p.cantidad || 1), 0);

      if (total > 0) {
        badge.textContent = total;
        badge.style.display = "inline-block";
      } else {
        badge.style.display = "none";
      }
    }
  }

  // =========================
  // SYNC BACKEND
  // =========================
  async function syncCarritoBackend(producto) {
    try {
      await fetch("/api/carrito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          producto_id: producto.id,
          cantidad: producto.cantidad
        })
      });
    } catch (e) {
      console.warn("No se pudo sync con backend", e);
    }
  }

  // =========================
  // VARIABLES UI
  // =========================
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");

  // =========================
  // RENDER
  // =========================
  function renderCart() {
    if (cartItems) cartItems.innerHTML = "";

    let total = 0;

    carrito.forEach((item, index) => {
      const precio = Number(item.precio ?? item.price ?? 0);
      const subtotal = precio * item.cantidad;
      total += subtotal;

      const li = document.createElement("li");
      li.innerHTML = `
        <span>${item.nombre || item.name} x${item.cantidad} - $${subtotal}</span>
        <button data-index="${index}" class="remove-item">×</button>
      `;
      cartItems?.appendChild(li);
    });

    if (cartTotal) cartTotal.textContent = total.toFixed(2);

    guardarCarrito(carrito);

    
    actualizarCarritoCount();
  }

  // =========================
  // ABRIR / CERRAR
  // =========================
  const cartBtn = document.getElementById("cartbtn");
  const cartOverlay = document.querySelector(".cart-overlay");
  const sideCartMenu = document.getElementById("cartMenu");

  if (cartBtn && cartOverlay && sideCartMenu) {
    cartBtn.addEventListener("click", () => {
      cartOverlay.classList.toggle("activecart");
    });

    cartOverlay.addEventListener("click", (e) => {
      if (!sideCartMenu.contains(e.target)) {
        cartOverlay.classList.remove("activecart");
      }
    });
  }

  // =========================
  // AÑADIR AL CARRITO
  // =========================
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".add-cart");
    if (!btn) return;

    const product = {
      id: Number(btn.dataset.id),
      nombre: btn.dataset.name,
      precio: Number(btn.dataset.price),
      cantidad: 1
    };

    const existing = carrito.find(p => p.id === product.id);

    if (existing) {
      existing.cantidad++;
      await syncCarritoBackend({ id: product.id, cantidad: 1 });
    } else {
      carrito.push(product);
      await syncCarritoBackend(product);
    }

    renderCart(); 
  });

  // =========================
  // ELIMINAR ITEM
  // =========================
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".remove-item");
  if (!btn) return;

  const index = btn.dataset.index;
  const item = carrito[index];

  await syncCarritoBackend({
    id: item.id,
    cantidad: -item.cantidad
  });

  carrito.splice(index, 1);

  renderCart();
});

  // =========================
  // COMPRA
  // =========================

const buyBtn = document.getElementById("buy-btn");

if (buyBtn) {
  buyBtn.addEventListener("click", async () => {

    if (!carrito.length) return alert("Carrito vacío");

    try {
      const productosEnvio = carrito.map(p => ({
        id: p.id,
        name: p.nombre,
        price: p.precio,
        cantidad: p.cantidad
      }));

      const res = await fetch("/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tipo: "envio",
          productos: productosEnvio
        })
      });

      const data = await res.json();

      if (!data.ok) {
        alert("Error en compra");
        return;
      }

      carrito = [];
      guardarCarrito(carrito);
      renderCart();

    } catch (err) {
      console.error(err);
      alert("Error");
    }

  });
}

  // =========================
  // INIT
  // =========================
  renderCart();            
});
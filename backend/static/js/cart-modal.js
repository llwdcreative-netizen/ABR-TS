document.addEventListener("DOMContentLoaded", async () => {

  async function validarCarrito() {
  try {
    const res = await fetch("/api/productos"); // endpoint de productos
    if (!res.ok) return;

    const productos = await res.json();

    // IDs válidos
    const idsValidos = productos.map(p => p.id);

    carrito = carrito.filter(item => idsValidos.includes(item.id));

    carrito = carrito.map(item => {
    const prod = productos.find(p => p.id === item.id);
    if (!prod) return null;

    return {
      ...item,
      precio: prod.precio
    };
  }).filter(Boolean);

    guardarCarrito(carrito);

  } catch (e) {
    console.warn("Error validando carrito", e);
  }
}

  async function crearPagoCarrito(carrito, email, tipo, referencia_id) {
    const items = carrito.map(p => ({
      title: p.nombre || p.name || "Producto",
      quantity: Number(p.cantidad || 1),
      unit_price: Number(p.precio ?? p.price ?? 0),
      currency_id: "ARS"
    }));

    const res = await fetch("/create_preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        items,
        payer: { email },
        metadata: { tipo, referencia_id },
        back_urls: {
          success: "https://abr-ts.onrender.com/estado?tipo=success",
          failure: "https://abr-ts.onrender.com/estado?tipo=error",
          pending: "https://abr-ts.onrender.com/estado?tipo=pending"
        },
        auto_return: "approved"
      })
    });

    const data = await res.json();
    if (!data.ok) throw new Error("Error creando pago");

    window.location.href =
      `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${data.preference_id}`;
  }

  function obtenerCarrito() {
    return JSON.parse(localStorage.getItem("carrito")) || [];
  }

  function guardarCarrito(carrito) {
    localStorage.setItem("carrito", JSON.stringify(carrito));
  }

  let carrito = obtenerCarrito();

  await validarCarrito(); 




function actualizarCarritoCount() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;

  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  const total = carrito.reduce((acc, p) => acc + (p.cantidad || 1), 0);

  badge.textContent = total;
  badge.style.display = total > 0 ? "inline-block" : "none";
}





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

  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");

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

  const buyBtn = document.getElementById("buy-btn");

  buyBtn.addEventListener("click", () => {

  if (!carrito.length) {
    showNotification("Carrito vacío", "error");
    return;
  }

  let total = carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);

  window.openModalCompra({
    nombre: "Compra del carrito",
    precio: total,
    envio: 0,

onConfirm: async (tipoEntrega) => {

  console.log("🔥 onConfirm ejecutado");

  const carritoMP = carrito;

  let bodyData = {
    tipo: tipoEntrega,
    origen: "carrito",
    productos: carritoMP
  };

  console.log("🟡 antes de validación");

  if (tipoEntrega === "envio") {
    const nombre = document.getElementById("env-nombre")?.value.trim();
    const telefono = document.getElementById("env-telefono")?.value.trim();
    const email = document.getElementById("env-email")?.value.trim();
    const calle = document.getElementById("env-calle")?.value.trim();
    const numero = document.getElementById("env-numero")?.value.trim();
    const ciudad = document.getElementById("env-ciudad")?.value.trim();
    const provincia = document.getElementById("env-provincia")?.value.trim();
    const cp = document.getElementById("env-cp")?.value.trim();

  if (!nombre || !telefono || !calle || !numero || !ciudad || !provincia || !cp) {
    showNotification("Completá los datos de envío", "error");
    return;
  }

    bodyData = {
      ...bodyData,
      nombre,
      telefono,
      email,
      calle,
      numero,
      ciudad,
      provincia,
      cp
    };
  }

  if (tipoEntrega === "retiro") {
    const nombre = document.getElementById("cliente")?.value.trim();

    bodyData = {
      ...bodyData,
      cliente: { nombre }
    };
  }

  console.log("BODY FINAL:", bodyData);

  const res = await fetch("/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(bodyData)
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("ERROR BACKEND:", data);
    showNotification(data.error || "Error en compra", "error");
    return;
  }

    console.log("PEDIDO ID:", data.pedido_id);

await crearPagoCarrito(
  carrito,
  "test@test.com",
  tipoEntrega,
  tipoEntrega === "envio" ? data.envio_id : data.pedido_id
);

showNotification("Redirigiendo a pago...", "success");
}
  });
});
  renderCart();
});
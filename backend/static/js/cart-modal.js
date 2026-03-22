document.addEventListener("DOMContentLoaded", () => {
// =========================
// FUNCIONES GLOBALES
// =========================
function obtenerCarrito() {
  return JSON.parse(localStorage.getItem("carrito")) || [];
}

function guardarCarrito(carrito) {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

async function crearPagoCarrito(carrito, email, tipo, referencia_id) {

  if (!tipo || !["envio", "retiro"].includes(tipo)) {
    throw new Error("Tipo de compra inválido");
  }

  if (!referencia_id) {
    throw new Error("Falta referencia_id");
  }


  const items = carrito
    .map(p => ({
      title: p.nombre || p.name || "Producto",
      quantity: Number(p.cantidad || 1),
      unit_price: Number(p.precio ?? p.price ?? 0),
      currency_id: "ARS"
    }))
    .filter(i => i.quantity > 0 && i.unit_price > 0);

  if (!items.length) throw new Error("Items inválidos");

  const payload = {
    items,
    tipo,          // "envio" | "retiro"
    referencia_id, // envio_id o retiro_id
    payer: { email: email || "cliente@correo.com" },
    back_urls: {
      success: "https://abr-ts.onrender.com/mp/gracias.html",
      failure: "https://abr-ts.onrender.com/mp/error.html",
      pending: "https://abr-ts.onrender.com/mp/pendiente.html"
    },
    auto_return: "approved"
  };

  const res = await fetch("http://127.0.0.1:5000/create_preference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Error creando preferencia");
  }

  window.location.href =
    `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${data.preference_id}`;
}

// =========================
// VARIABLES DEL CARRITO
// =========================

let carrito = obtenerCarrito();

const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const buyBtn = document.getElementById("buy-btn");

// =========================
// RENDER CARRITO
// =========================

function renderCart() {
  if(cartItems){
    cartItems.innerHTML = ""
}
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
    cartItems.appendChild(li);
  });

  cartTotal.textContent = total.toFixed(2);
  guardarCarrito(carrito);
}

    // =========================
  // ABRIR / CERRAR CARRITO
  // =========================

    const cartBtn = document.getElementById("cartbtn");
    const cartOverlay = document.querySelector(".cart-overlay");
    const sideCartMenu = document.getElementById("cartMenu");
    const orderModal = document.getElementById("orderModal");
    const modalCompra = document.getElementById("modal-compra");


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
    let tipoEntrega = null; // 'envio' | 'retiro'
    // =========================
  // AÑADIR AL CARRITO
  // =========================
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-cart");
    if (!btn) return;

    const product = {
      id: Number(btn.dataset.id),
      nombre: btn.dataset.name,
      precio: Number(btn.dataset.price),
      cantidad: 1
    };

    if (!product.id || !product.nombre || !product.precio) {
      console.warn("Producto inválido para carrito:", product);
      return;
    }

    const existing = carrito.find(p => p.id === product.id);

    if (existing) {
      existing.cantidad++;
    } else {
      carrito.push(product);
    }

    renderCart();
  });


  // Eliminar item
  document.addEventListener("click", e => {
    const btn = e.target.closest(".remove-item");
    if (!btn) return;
    carrito.splice(btn.dataset.index, 1);
    renderCart();
  });

    // =========================
  // BOTÓN COMPRAR (PANEL CARRITO)
  // =========================
  if (buyBtn) {
    buyBtn.addEventListener("click", () => {
      if (!carrito.length) {
        alert("Tu carrito está vacío 😅");
        return;
      }

      const orderSummary = document.getElementById("order-summary");
      const orderTotal = document.getElementById("order-total");

      orderSummary.innerHTML = "";
      let subtotal = 0;

      carrito.forEach(item => {
        const nombre = item.nombre || item.name || "Producto";
        const precio = Number(item.precio ?? item.price ?? 0);
        const cantidad = Number(item.cantidad ?? 1);

        const li = document.createElement("li");
        li.textContent = `${nombre} x${cantidad} – $${(precio * cantidad).toFixed(2)}`;
        orderSummary.appendChild(li);

        subtotal += precio * cantidad;
      });

      orderTotal.textContent = subtotal.toFixed(2);
      orderModal.style.display = "block";
    });
  }
// =========================
// SELECCIÓN ENVÍO / RETIRO
// =========================
const radiosEntrega = document.querySelectorAll('input[name="entrega"]');
const formEnvio = document.getElementById("form-envio");

radiosEntrega.forEach(radio => {
  radio.addEventListener("change", () => {
    tipoEntrega = radio.value; // 'envio' o 'retiro'

    if (tipoEntrega === "envio") {
      formEnvio?.classList.remove("oculto");
    } else {
      formEnvio?.classList.add("oculto");
    }
  });
});


  // =========================
  // CONFIRMAR COMPRA
  // =========================
  const continuarBtn = document.getElementById("confirm-btn");

  if (continuarBtn) {
  continuarBtn.addEventListener("click", () => {
    orderModal.style.display = "none";
    modalCompra.style.display = "block";
  });
}

const confirmarCompraBtn = document.getElementById("confirmar-compra");

if (confirmarCompraBtn) {
  confirmarCompraBtn.addEventListener("click", async () => {

    if (!carrito.length) return alert("Carrito vacío");

    if (!tipoEntrega) {
      alert("Seleccioná envío o retiro");
      return;
    }

    try {

      // 1️⃣ Normalizar productos
      const productosEnvio = carrito.map(p => ({
        id: p.id,
        name: p.nombre || p.name,
        price: Number(p.precio ?? p.price),
        cantidad: Number(p.cantidad)
      }));




const res = await fetch("/purchase", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    tipo: tipoEntrega,
    productos: productosEnvio,

    // ENVÍO
    nombre: document.getElementById("env-nombre")?.value,
    telefono: document.getElementById("env-telefono")?.value,
    email: "cliente@correo.com",
    calle: document.getElementById("env-calle")?.value,
    numero: document.getElementById("env-numero")?.value,
    piso: document.getElementById("env-piso")?.value,
    barrio: document.getElementById("env-barrio")?.value,
    ciudad: document.getElementById("env-ciudad")?.value,
    provincia: document.getElementById("env-provincia")?.value,
    cp: document.getElementById("env-cp")?.value,
    notas: document.getElementById("env-notas")?.value,

    // RETIRO
    cliente: {
      nombre: document.getElementById("cliente")?.value || ""
    }
  })
});

const data = await res.json();

if (!data.ok || !data.pedido_id) {
  console.error("Error:", data);
  alert("No se pudo crear el pedido");
  return;
}

console.log("TIPO:", tipo)
await crearPagoCarrito(
  carrito,
  "cliente@correo.com",
  data.tipo,        // 👈 viene del backend
  data.pedido_id    // 👈 ID ÚNICO
) 
carrito = [];
guardarCarrito(carrito);
    } catch (err) {
      console.error(err);
      alert("Error iniciando pago");
    }

  });
}

});

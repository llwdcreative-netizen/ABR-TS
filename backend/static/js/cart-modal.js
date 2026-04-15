document.addEventListener("DOMContentLoaded", () => {
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
    tipo,
    referencia_id,
    payer: { email },

    back_urls: {
          "success": "https://abr-ts.onrender.com/estado?tipo=success",
          "failure": "https://abr-ts.onrender.com/estado?tipo=error",
          "pending": "https://abr-ts.onrender.com/estado?tipo=pending"
    },

    auto_return: "approved"
  })
});

  const data = await res.json();

  if (!data.ok) throw new Error("Error creando pago");

  window.location.href =
    `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${data.preference_id}`;
}

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


  // =========================
// MODOS DE ENTREGA (ENVÍO / RETIRO)
// =========================

const radiosEntrega = document.querySelectorAll('input[name="entrega"]');
const formEnvio = document.getElementById("form-envio");
const retiroInfo = document.getElementById("retiro-info");

if (radiosEntrega.length) {
  radiosEntrega.forEach(radio => {
    radio.addEventListener("change", () => {

      if (radio.value === "envio") {
        formEnvio?.classList.remove("oculto");
        retiroInfo?.classList.add("oculto");
      }

      if (radio.value === "retiro") {
        retiroInfo?.classList.remove("oculto");
        formEnvio?.classList.add("oculto");
      }

    });
  });
}

const buyBtn = document.getElementById("buy-btn");
const confirmarCompraBtn = document.getElementById("confirmar-compra-cart");
const orderSummary = document.getElementById("order-summary");
const orderTotal = document.getElementById("order-total");
const orderModal = document.getElementById("orderModal");

if (buyBtn && orderSummary && orderTotal && orderModal) {
  buyBtn.addEventListener("click", () => {

    if (!carrito.length) {
      alert("Carrito vacío");
      return;
    }

    orderSummary.innerHTML = "";
    let total = 0;

    carrito.forEach(item => {
      const nombre = item.nombre || item.name || "Producto";
      const precio = Number(item.precio ?? item.price ?? 0);
      const cantidad = Number(item.cantidad ?? 1);

      const li = document.createElement("li");
      li.textContent = `${nombre} x${cantidad} - $${precio * cantidad}`;

      orderSummary.appendChild(li);

      total += precio * cantidad;
    });

    orderTotal.textContent = total.toFixed(2);

    orderModal.style.display = "block";
  });
}


const confirmBtn = document.getElementById("confirm-btn");
const modalCompra = document.getElementById("modal-compra");

if (confirmBtn && orderModal && modalCompra) {
  confirmBtn.addEventListener("click", () => {
    orderModal.style.display = "none";
    modalCompra.style.display = "block";
  });
}




if (confirmarCompraBtn) {
  confirmarCompraBtn.addEventListener("click", async (e) => {
  e.preventDefault();

    if (!carrito.length) return alert("Carrito vacío");

    try {
      const productosEnvio = carrito.map(p => ({
        id: p.id,
        name: p.nombre,
        price: p.precio,
        cantidad: p.cantidad
      }));

      const tipoEntrega = document.querySelector('input[name="entrega"]:checked')?.value;

      if (!tipoEntrega) {
      return alert("Seleccioná método de entrega");
    }

      const bodyData = {
        tipo: tipoEntrega,
        productos: productosEnvio
      };

if (tipoEntrega === "envio") {

  const nombre = document.getElementById("env-nombre")?.value.trim();
  const telefono = document.getElementById("env-telefono")?.value.trim();
  const emailInput = document.getElementById("env-email")?.value.trim();
  const calle = document.getElementById("env-calle")?.value.trim();
  const numero = document.getElementById("env-numero")?.value.trim();
  const ciudad = document.getElementById("env-ciudad")?.value.trim();
  const provincia = document.getElementById("env-provincia")?.value.trim();
  const cp = document.getElementById("env-cp")?.value.trim();

  if (!nombre || !telefono || !calle || !numero || !ciudad || !provincia || !cp) {
    return alert("Completá los datos obligatorios de envío");
  }


  bodyData.nombre = nombre;
  bodyData.telefono = telefono;
  bodyData.email = emailInput;
  bodyData.calle = calle;
  bodyData.numero = numero;
  bodyData.ciudad = ciudad;
  bodyData.provincia = provincia;
  bodyData.cp = cp;

  console.log("BODY:", bodyData);

  const piso = document.getElementById("env-piso")?.value.trim();
  const barrio = document.getElementById("env-barrio")?.value.trim();
  const notas = document.getElementById("env-notas")?.value.trim();

  if (piso) bodyData.piso = piso;
  if (barrio) bodyData.barrio = barrio;
  if (notas) bodyData.notas = notas;
}


      const res = await fetch("/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(bodyData)
        
      });

      const data = await res.json();

      if (!data.ok) {
        alert(data.error || "Error en compra");
        return;
      }

      const email = bodyData.email || "test@test.com";

      await crearPagoCarrito(
        carrito,
        email,
        tipoEntrega,
        data.pedido_id
      );

      carrito = [];
      guardarCarrito(carrito);
      renderCart();

      alert("Compra realizada 🎉");

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
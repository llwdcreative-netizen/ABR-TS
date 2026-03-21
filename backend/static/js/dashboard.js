document.addEventListener("DOMContentLoaded", async () => {
  try {
    // ========================
    // VERIFICAR SESIÓN
    // ========================
    const res = await fetch("/me", { 
      credentials: "include" 
    });
    const data = await res.json();

    if (!data || !data.logged) {
      console.warn("Usuario no autenticado → redirigiendo");
      window.location.href = "login.html";
      return;
    }

    // ========================
    // RENDERIZAR DATOS DEL USUARIO
    // ========================
    const elEmail = document.getElementById("user-email");
    const elNombre = document.getElementById("p-nombre");
    const elPEMail = document.getElementById("p-email");

    if (elEmail) elEmail.textContent = data.email || "";
    if (elNombre) elNombre.textContent = data.nombre || "";
    if (elPEMail) elPEMail.textContent = data.email || "";

    // ========================
    // OBTENER HISTORIAL DE COMPRAS
    // ========================

    const resHistory = await fetch("/purchase/history", { 
      credentials: "include" 
    });

    const historial = await resHistory.json();

    console.log("Historial recibido:", historial);

    const container = document.getElementById("purchase-history");
    if (!container) return;

    container.innerHTML = "";

    // Validar formato
    if (!Array.isArray(historial)) {
      container.innerHTML = "<p>Error al cargar historial.</p>";
      console.error("Historial inválido:", historial);
      return;
    }

    console.log("Historial completo:", historial);
    console.log("Envios:", historial.envios, "Retiros:", historial.retiros);

    // Combinar envios y retiros para mostrar
    const purchases = historial;

    if (purchases.length === 0) {
      container.innerHTML = "<p>No tienes compras registradas.</p>";
      return;
    }

    // ========================
    // RENDERIZAR CADA ORDEN
    // ========================

    purchases.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));

purchases.forEach(order => {
  console.log("PRODUCTOS QUE LLEGAN:", order.productos);
  console.log("ORDER RAW:", order);

  let productosHTML = "";

  const [fecha = "—", hora = "—"] = (order.fecha || "").split(" ");

  let subtotal = Number(order.subtotal) || 0;
  let envio = Number(order.envio) || 0;
  let retiro = Number(order.retiro) || 0;
  let total = Number(order.total) || (subtotal + envio + retiro);

  let estado = order.estado || "pendiente";

  // ============================
  //   NUEVO SOPORTE PARA STRING
  // ============================
  if (Array.isArray(order.productos) && order.productos.length > 0) {
    // Si viniera como array (caso viejo)
    order.productos.forEach(p => {
      if (typeof p === "string") {
        productosHTML += `<li>${p}</li>`;
        return;
      }
      const name = 
      p.name || 
      p.item || 
      "Producto";

      const qty = 
      p.cantidad || 
      p.qty || 
      1;

      const price = 
      p.price  || 
      0;

      const subtotalLinea = price * qty;

      productosHTML += `
      <li>${name} x${qty} — $${(price * qty).toFixed(2)}</li>
      `;
    });

  }

  else if (typeof order.productos === "string") {
    // Si viene como string del backend nuevo
    const lista = order.productos
    .replace(/[\[\]"]/g, "")
    .split(",")
    .map(i => i.trim());

    lista.forEach(item => {
      productosHTML += `<li>${item}</li>`;
    });
  }

const orderDiv = document.createElement("div");
orderDiv.classList.add("purchase-order");
orderDiv.style.cursor = "pointer";

orderDiv.onclick = () => {
  if (!order.id) {
    alert("Pedido sin ID");
    return;
  }
  const tipo = order.tipo || "envio";
  window.location.href = `/mipedido?id=${order.id}&tipo=${tipo}`;

};

orderDiv.innerHTML = `
  <strong>Compra del ${fecha} — ${hora}</strong><br>
  <em>Tipo: ${order.metodo || order.tipo || "—"}</em>
  <ul>${productosHTML}</ul>
  <p>Subtotal: $${subtotal !== null ? subtotal.toFixed(2) : "—"}</p>
  <p>Envío: $${envio.toFixed(2)}</p>
  <strong>Total: $${total.toFixed(2)}</strong>
  <p><em>Estado: ${estado}</em></p>
  <small>Click para ver detalle</small>
  <hr>
`;

  container.appendChild(orderDiv);
});

    // ========================
    // BOTÓN DE CIERRE DE SESIÓN
    // ========================
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await fetch("/logout", { method: "POST", credentials: "include" });
        window.location.href = "/login";
      });
    }

  } catch (err) {
    console.error("Error inesperado en dashboard:", err);
  }
});

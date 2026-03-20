// detail.js
document.addEventListener("DOMContentLoaded", async () => {
    async function checkLogin() {
    const res = await fetch("http://127.0.0.1:5000/me", {
      credentials: "include"
    });
    const data = await res.json();
    return data.logged === true;
  }

  /* =======================
      1. OBTENER ID PRODUCTO
  ======================== */
const pathParts = window.location.pathname.split("/");
const id = pathParts[pathParts.length - 1];

if (!id || isNaN(id)) {
  console.warn("detail.js -> Falta ID en URL");
  return;
}
console.log("ID detectado:", id);


  /* =======================
      2. CARGAR PRODUCTOS
  ======================== */
  let shippingCost = 0;
  let producto;

try {
  const resp = await fetch(`/api/productos/${id}`, {
    credentials: "include"
  });
  producto = await resp.json();
} catch (err) {
  console.error("Error cargando productos desde Flask:", err);
  return;
}
console.log("RESPUESTA PRODUCTO:", producto);
if (!producto || !producto.id) {
  console.error("Producto inválido");
  return;
}


  try {
    const shippingResp = await fetch("/api/shipping");
  const shippingData = await shippingResp.json();
  shippingCost = shippingData.shippingCost || 0;
  } catch (err) {
    console.error("Error cargando shipping.json:", err);
  }

  const addBtn = document.getElementById("add-to-cart-detail");

  addBtn.classList.add("add-cart");
  
  addBtn.dataset.id = producto.id;
  addBtn.dataset.name = producto.nombre;
  addBtn.dataset.price = producto.precio;


  /* =======================
      3. LLENAR DETALLE
  ======================== */
    document.getElementById("prod-imagen").src =
    producto.imagen
    ? `/static/uploads/${producto.imagen}`
    : "/static/img/placeholder.png";
    document.getElementById("prod-nombre").textContent = producto.nombre;
    document.getElementById("prod-precio").textContent =
    `$${Number(producto.precio).toLocaleString("es-AR")}`;
    document.getElementById("fav-btn").dataset.id = producto.id;
    document.getElementById("prod-descripcion").textContent =
    producto.descripcion || "";

  /* =======================
      4. MODAL COMPRA
  ======================== */
  const buyNow = document.getElementById("buy-now");
  const modal = document.getElementById("modal-compra");

  const modalNombre = document.getElementById("modal-nombre");
  const modalPrecio = document.getElementById("modal-precio");
  const modalEnvio = document.getElementById("costo-envio");

  const envioInfo = document.getElementById("form-envio");
  const retiroInfo = document.getElementById("retiro-info");

  const cerrar = document.querySelector(".close-modal");
  let confirmar = document.getElementById("confirmar-compra");
  if (!confirmar) return;

  /* =======================
      5. ENTREGA RADIO
  ======================== */
  document.querySelectorAll("input[name='entrega']").forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.value === "envio") {
        envioInfo.classList.remove("oculto");
        retiroInfo.classList.add("oculto");
      } else {
        retiroInfo.classList.remove("oculto");
        envioInfo.classList.add("oculto");
      }
    });
  });

  /* =======================
      6. RESETEAR BOTÓN
  ======================== */
  function resetConfirmarCompra(callback) {
    const nuevo = confirmar.cloneNode(true);
    confirmar.parentNode.replaceChild(nuevo, confirmar);
    confirmar = nuevo;
    confirmar.addEventListener("click", callback);
  }

  /* =======================
      7. MERCADO PAGO
  ======================== */
async function crearPagoMercadoPago(items, tipo, referencia_id, email) {
  if (!tipo || !["envio", "retiro"].includes(tipo)) {
    throw new Error("Tipo inválido");
  }

  if (!referencia_id) {
    throw new Error("Referencia inválida");
  }

  const payload = {
    items: items.map(p => ({
      title: p.name,
      quantity: p.cantidad,
      unit_price: Number(p.price),
      currency_id: "ARS"
    })),
    tipo,
    referencia_id,
    payer: { email: email || "cliente@correo.com" }
  };

  const res = await fetch("/create_preference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log("RESPUESTA MP:", data);

  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Error creando preferencia");
  }

  window.location.href =
    `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${data.preference_id}`;
}
  /* =======================
      8. ABRIR MODAL
  ======================== */
  if (buyNow) {
  buyNow.addEventListener("click", async () => {

    const logged = await checkLogin();
    if (!logged) {
      alert("Tenés que iniciar sesión para comprar");
      window.location.href = "/login";
      return;
    }

    modalNombre.textContent = producto.nombre;
    modalPrecio.textContent =
      `$${Number(producto.precio).toLocaleString("es-AR")}`;
    modalEnvio.textContent =
      `Costo de envío: $${shippingCost.toLocaleString("es-AR")}`;

    modal.style.display = "block";

    resetConfirmarCompra(async () => {
      const metodo = document.querySelector("input[name='entrega']:checked");
      if (!metodo) return alert("Seleccioná un método de entrega");

      const envioCosto = metodo.value === "envio" ? shippingCost : 0;

      const carritoMP = [{
        name: producto.nombre,
        price: producto.precio,
        cantidad: 1
      }];

      const emailCliente =
        metodo.value === "envio"
          ? document.getElementById("env-email").value
          : "cliente@correo.com";

          const endpoint = "/purchase";

          const body =
            metodo.value === "envio"
              ? {
                  tipo: "envio",   // 🔥 clave nueva
                  nombre: document.getElementById("env-nombre")?.value,
                  telefono: document.getElementById("env-telefono")?.value,
                  email: emailCliente,
                  calle: document.getElementById("env-calle")?.value,
                  numero: document.getElementById("env-numero")?.value,
                  piso: document.getElementById("env-piso")?.value,
                  barrio: document.getElementById("env-barrio")?.value,
                  ciudad: document.getElementById("env-ciudad")?.value,
                  provincia: document.getElementById("env-provincia")?.value,
                  cp: document.getElementById("env-cp")?.value,
                  notas: document.getElementById("env-notas")?.value,
                  productos: carritoMP
                }
              : {
                  tipo: "retiro",
                  email: emailCliente,
                  productos: carritoMP,
                  cliente: {
                    nombre: document.getElementById("cliente")?.value || ""
                  }
                };



      try {
        const resCompra = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body)
        });

        const data = await resCompra.json();
        if (!data.ok) {
          alert("No se pudo crear el pedido");
          return;
        }

const pedidoId = data.pedido_id;
const envioId = data.envio_id;

let referenciaId;

if (metodo.value === "envio") {
  referenciaId = envioId;
} else {
  referenciaId = pedidoId;
}

if (!referenciaId) {
  console.error("Referencia inválida:", data);
  alert("Error interno: referencia inválida");
  return;
}

await crearPagoMercadoPago(
  carritoMP,
  metodo.value,
  referenciaId,
  emailCliente
);

      } catch (err) {
        console.error(err);
        alert("No se pudo iniciar el pago");
      }
    });
  });
}
  /* =======================
      9. CERRAR MODAL
  ======================== */
  if (cerrar) cerrar.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });

});

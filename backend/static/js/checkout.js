document.addEventListener("DOMContentLoaded", () => {
  const confirmarBtn = document.getElementById("confirmar-compra");
  if (!confirmarBtn) return;

  let procesando = false; // 🔥 evita doble click

  confirmarBtn.addEventListener("click", async () => {
    if (procesando) return;
    procesando = true;
    confirmarBtn.disabled = true;

    const metodoEl = document.querySelector("input[name='entrega']:checked");
    if (!metodoEl) {
      alert("Seleccioná un método de entrega");
      procesando = false;
      confirmarBtn.disabled = false;
      return;
    }

    const productos = JSON.parse(localStorage.getItem("carrito")) || [];
    if (!productos.length) {
      alert("Tu carrito está vacío 😅");
      procesando = false;
      confirmarBtn.disabled = false;
      return;
    }

    let datos = {
      nombre: "", telefono: "", email: "",
      calle: "", numero: "", piso: "",
      barrio: "", ciudad: "", provincia: "",
      cp: "", notas: ""
    };

    // =====================
    // DATOS SEGÚN MÉTODO
    // =====================
    if (metodoEl.value === "envio") {
      datos.nombre = document.getElementById("env-nombre").value.trim();
      datos.telefono = document.getElementById("env-telefono").value.trim();
      datos.email = document.getElementById("env-email").value.trim();
      datos.calle = document.getElementById("env-calle").value.trim();
      datos.numero = document.getElementById("env-numero").value.trim();
      datos.barrio = document.getElementById("env-barrio").value.trim();
      datos.ciudad = document.getElementById("env-ciudad").value.trim();

      if (!datos.nombre || !datos.calle || !datos.numero || !datos.ciudad) {
        alert("Completá los datos obligatorios del envío.");
        procesando = false;
        confirmarBtn.disabled = false;
        return;
      }
    } else {
      datos.nombre = document.getElementById("cliente").value.trim();
      if (!datos.nombre) {
        alert("Ingresá el nombre de quien retira.");
        procesando = false;
        confirmarBtn.disabled = false;
        return;
      }
    }

    try {
      // =====================
      // 1️⃣ CREAR PEDIDO
      // =====================
      const tipo = metodoEl.value;

      const pedidoResp = await fetch("/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tipo,
          ...datos,
          productos
        })
      });

      const pedidoData = await pedidoResp.json();

      if (!pedidoData.ok) {
        console.error(pedidoData);
        alert("Error creando el pedido");
        procesando = false;
        confirmarBtn.disabled = false;
        return;
      }

      const pedidoId = pedidoData.pedido_id;

      // =====================
      // 2️⃣ MERCADO PAGO
      // =====================
      const mpPayload = {
        items: productos.map(p => ({
          title: p.nombre,
          quantity: p.cantidad,
          unit_price: Number(p.precio),
          currency_id: "ARS"
        })),

        payer: {
          email: datos.email || "test@test.com" // fallback simple
        },

        metadata: {
          tipo: tipo,
          referencia_id: pedidoId   // 🔥 CLAVE
        }
      };

      const mpResp = await fetch("/create_preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(mpPayload)
      });

      const mpData = await mpResp.json();

      if (!mpData.ok) {
        console.error(mpData);
        alert("Error iniciando el pago");
        procesando = false;
        confirmarBtn.disabled = false;
        return;
      }

      // 🔥 REDIRECCIÓN CORRECTA
      window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${mpData.preference_id}`;

    } catch (err) {
      console.error(err);
      alert("Error inesperado en la compra");
      procesando = false;
      confirmarBtn.disabled = false;
    }
  });
});
document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("modal-compra");
  if (!modal) return;

  const modalNombre = document.getElementById("modal-nombre");
  const modalPrecio = document.getElementById("modal-precio");
  const modalEnvio = document.getElementById("costo-envio");

  const formEnvio = document.getElementById("form-envio");
  const retiroInfo = document.getElementById("retiro-info");
  const confirmBtn = document.getElementById("confirmar-compra-cart");

  let currentContext = null;
  let baseTotal = 0;
  let shippingCache = null; // 🔥 cache real

  // =========================
  // FETCH SHIPPING REAL
  // =========================
  async function getShippingCost() {
    if (shippingCache !== null) return shippingCache;

    try {
      const res = await fetch("/api/shipping");
      const data = await res.json();
      shippingCache = Number(data.shippingCost || 0);
      return shippingCache;
    } catch (err) {
      console.error("Error obteniendo envío", err);
      return 0;
    }
  }

  // =========================
  // RESET
  // =========================
  function resetModal() {
    const radios = modal.querySelectorAll('input[name="entrega"]');

    radios.forEach(r => (r.checked = false));

    formEnvio?.classList.add("oculto");
    retiroInfo?.classList.add("oculto");

    modal.querySelectorAll("input, textarea").forEach(i => {
      if (i.type !== "radio") i.value = "";
    });

    modalPrecio.textContent = "";
    modalNombre.textContent = "";
    modalEnvio.classList.add("oculto");
  }

  // =========================
  // RENDER TOTAL DINÁMICO
  // =========================
  async function renderModalSummary(tipo) {
    if (!currentContext) return;

    let total = baseTotal;

    if (tipo === "envio") {
      const envio = await getShippingCost(); // 🔥 valor real backend

      total += envio;

      modalEnvio.textContent =
        `Costo de envío: $${envio.toLocaleString("es-AR")}`;

      modalEnvio.classList.remove("oculto");
    } else {
      modalEnvio.classList.add("oculto");
    }

    modalPrecio.textContent = `$${total.toLocaleString("es-AR")}`;
  }

  // =========================
  // CAMBIO ENTREGA
  // =========================
  modal.addEventListener("change", async (e) => {
    if (!e.target.matches('input[name="entrega"]')) return;

    const tipo = e.target.value;

    if (tipo === "envio") {
      formEnvio?.classList.remove("oculto");
      retiroInfo?.classList.add("oculto");
    }

    if (tipo === "retiro") {
      retiroInfo?.classList.remove("oculto");
      formEnvio?.classList.add("oculto");
    }

    await renderModalSummary(tipo); // 🔥 importante
  });

  // =========================
  // ABRIR MODAL
  // =========================
  window.openModalCompra = (data) => {
    currentContext = data;

    resetModal();

    baseTotal = Number(data.precio || 0);

    modalNombre.textContent = data.nombre || "";
    modalPrecio.textContent =
      `$${baseTotal.toLocaleString("es-AR")}`;

    modal.style.display = "flex";
  };

  // =========================
  // CONFIRMAR COMPRA
  // =========================
  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      if (!currentContext) return;

      const metodo = modal.querySelector('input[name="entrega"]:checked');

      if (!metodo) {
        alert("Seleccioná método de entrega");
        return;
      }

      try {
        await currentContext.onConfirm(metodo.value);
      } catch (err) {
        console.error(err);
        alert("Error en compra");
      }
    });
  }

  // =========================
  // CERRAR MODAL
  // =========================
  modal.querySelectorAll(".close-modal").forEach(btn => {
    btn.addEventListener("click", () => {
      modal.style.display = "none";
      resetModal();
    });
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      resetModal();
    }
  });

});
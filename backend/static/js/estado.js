function mostrarEstado(tipo) {  
  const modal = document.getElementById("status-modal");  
  const icon = document.getElementById("status-icon");  
  const title = document.getElementById("status-title");  
  const text = document.getElementById("status-text");  
  const btn = document.getElementById("status-btn");  
  
  const estados = {  
    success: {  
      icono: "✅",  
      titulo: "Pago aprobado",  
      texto: "Tu compra fue realizada con éxito.",  
      color: "#27ae60"  
    },  
    error: {  
      icono: "❌",  
      titulo: "Error en el pago",  
      texto: "Hubo un problema. Intentá nuevamente.",  
      color: "#e74c3c"  
    },  
    pending: {  
      icono: "⏳",  
      titulo: "Pago pendiente",  
      texto: "Tu pago está en proceso.",  
      color: "#f39c12"  
    }  
  };  
  
  const estado = estados[tipo];  
  if (!estado) return;

  icon.textContent = estado.icono;  
  title.textContent = estado.titulo;  
  text.textContent = estado.texto;  
  
  btn.style.background = estado.color;  
  btn.style.color = "#fff";  
  
  modal.classList.add("active");  
  
  btn.onclick = () => {  
    window.location.href = "/";  
  };  
}


document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);

  const tipo = params.get("tipo");        // success | failure | pending
  const paymentId = params.get("payment_id");

  // fallback simple
  if (!paymentId) {
    mostrarEstado(tipo || "error");
    return;
  }

  try {
    const res = await fetch(`/api/pago/verificar?payment_id=${paymentId}`);
    const data = await res.json();

    if (data.estado === "aprobado") {

    localStorage.removeItem("carrito");

      mostrarEstado(tipo || "error");
      return;

    if (window.carrito) {
      window.carrito = [];
    }
      mostrarEstado("success");
    } else if (data.estado === "pendiente") {
      mostrarEstado("pending");
    } else {
      mostrarEstado("error");
    }

  } catch (e) {
    console.error(e);

    // fallback si backend falla
    mostrarEstado(tipo || "error");
  }
});
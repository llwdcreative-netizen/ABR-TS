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

// 🔥 AUTO-DETECCIÓN DESDE URL
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const tipo = params.get("tipo");

  if (tipo) {
    mostrarEstado(tipo);
  }
});
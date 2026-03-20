let puntuacionSeleccionada = 0;
const productoId = window.location.pathname.split("/").pop();

// ⭐ seleccionar estrellas
document.querySelectorAll(".rating-input span").forEach(star => {
  star.addEventListener("click", function () {
    puntuacionSeleccionada = this.dataset.value;

    document.querySelectorAll(".rating-input span").forEach(s => {
      s.classList.remove("selected");
    });

    this.classList.add("selected");
  });
});

// 📤 enviar reseña
function enviarResena() {
  const comentario = document.getElementById("comentario").value;

  if (!comentario || !puntuacionSeleccionada) {
    alert("Completá todos los campos");
    return;
  }

  fetch("/api/reviews", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      producto_id: productoId,
      comentario: comentario,
      puntuacion: puntuacionSeleccionada
    })
  })
  .then(res => res.json())
  .then(() => {
    document.getElementById("comentario").value = "";
    puntuacionSeleccionada = 0;

    cargarResenas(); // recarga lista
  });
}

// 📥 cargar reseñas
function cargarResenas() {
  fetch(`/api/reviews/${productoId}`)
    .then(res => res.json())
    .then(data => {

      console.log("Respuesta backend:", data); // 👈 dejalo para debug

      const contenedor = document.getElementById("lista-resenas");
      contenedor.innerHTML = "";

      // 🔥 si backend devuelve { resenas: [...] }
      const lista = data.resenas || data;

      lista.forEach(r => {
        contenedor.innerHTML += `
            <div class="resena">
        <div class="resena-header">
        <strong class="resena-autor">${r.nombre}</strong>
        <span class="resena-fecha">
            ${new Date(r.fecha).toLocaleDateString()}
        </span>
        </div>

        <div class="resena-rating">
        ${"★".repeat(r.puntuacion)}
        ${"☆".repeat(5 - r.puntuacion)}
        </div>

        <p class="resena-comentario">${r.comentario}</p>
    </div>
    `;
      });
    });
}

// cargar al abrir la página
cargarResenas();
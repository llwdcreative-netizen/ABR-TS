let puntuacionSeleccionada = 0;
const productoId = window.location.pathname.split("/").pop();

//seleccionar estrellas
document.querySelectorAll(".rating-input span").forEach(star => {
  star.addEventListener("click", function () {

    puntuacionSeleccionada = Number(this.dataset.value);

    document.querySelectorAll(".rating-input span").forEach(s => {
      const value = Number(s.dataset.value);

      if (value <= puntuacionSeleccionada) {
        s.classList.add("selected");
      } else {
        s.classList.remove("selected"); 
      }
    });

  });
});

const stars = document.querySelectorAll(".rating-input span");

stars.forEach(star => {

  star.addEventListener("mouseover", function () {
    const value = Number(this.dataset.value);

    stars.forEach(s => {
      s.classList.toggle("hover", Number(s.dataset.value) <= value);
    });
  });

  star.addEventListener("mouseout", function () {
    stars.forEach(s => s.classList.remove("hover"));
  });

});
// 📤 enviar reseña
function enviarReview() {
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

    cargarReviews(); // recarga lista
  });
}

// 📥 cargar reseñas
function cargarReviews() {
  fetch(`/api/reviews/${productoId}`)
    .then(res => res.json())
    .then(data => {

      console.log("Respuesta backend:", data);

      const contenedor = document.getElementById("lista-reviews");
      if (!contenedor) return;
      contenedor.innerHTML = "";

      const lista = data.reviews || data;

      lista.forEach(r => {
        contenedor.innerHTML += `
            <div class="review">
        <div class="review-header">
        <strong class="review-autor">${r.nombre}</strong>
        <span class="review-fecha">
            ${new Date(r.fecha).toLocaleDateString()}
        </span>
        </div>

        <div class="review-rating">
        ${"★".repeat(r.puntuacion)}
        ${"☆".repeat(5 - r.puntuacion)}
        </div>

        <p class="review-comentario">${r.comentario}</p>
    </div>
    `;
      });
    });
}

// cargar al abrir la página
cargarReviews();
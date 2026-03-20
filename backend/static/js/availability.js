function controlarDisponibilidad() {
  const ahora = new Date();
  const horaActual = ahora.getHours();

  const horaInicio = 10;
  const horaFin = 24;

  const status = document.getElementById("availability-status");
  const buyButton = document.getElementById("buy-now");
  const addCartButton = document.getElementById("add-to-cart-detail")

  const disponible = horaActual >= horaInicio && horaActual < horaFin;

  if (disponible) {
    status.textContent = "Disponible ahora";
    status.className = "availability disponible";

    buyButton.disabled = false;
    buyButton.textContent = "Comprar";
    addCartButton.disabled = false;
    addCartButton.textContent = "Añadir al carrito";
  } else {
    status.textContent = "No disponible ahora · ⏰ Disponible de 20:00 a 23:00";
    status.className = "availability no-disponible";

    buyButton.disabled = true;
    buyButton.textContent = "No disponible";
    addCartButton.disabled = true;
    addCartButton.textContent = "No disponible";
  }
}

controlarDisponibilidad();

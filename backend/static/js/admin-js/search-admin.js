// ------------------- BUSCADOR DE PEDIDOS -------------------
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(".search-input");
  const clearBtn = document.querySelector(".clear-search");

  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    filtrarPedidos(query);
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      filtrarPedidos("");
    });
  }
});

function filtrarPedidos(texto) {
  const filas = document.querySelectorAll("#tabla-envios tr");

  filas.forEach((tr, index) => {
    // saltar header
    if (index === 0) return;

    const contenido = tr.dataset.search || "";
    const coincide = contenido.includes(texto);

    tr.style.display = coincide ? "" : "none";
  });
}

// ------------------- BUSCADOR DE PRODUCTOS -------------------
document.addEventListener("DOMContentLoaded", () => {
  
  const searchInput = document.querySelector(".search-input");
  const clearBtn = document.querySelector(".clear-search");

  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    filtrarBusqueda(query);
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      filtrarBusqueda("");
    });
  }
});

function filtrarBusqueda(texto) {
  const productos = document.querySelectorAll(".producto");

  productos.forEach(prod => {
    const nombre = prod.querySelector("h3")?.textContent.toLowerCase() || "";
    const coincide = nombre.includes(texto);

    prod.classList.toggle("oculto", !coincide);
  });
}

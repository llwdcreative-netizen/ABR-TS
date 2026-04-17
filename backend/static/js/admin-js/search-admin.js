// =========================
// BUSCADOR GLOBAL REUTILIZABLE
// =========================

document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll(".search-input").forEach(input => {

    const selector = input.dataset.target;
    if (!selector) return;

    const clearBtn = document.querySelector(".clear-search");

    input.addEventListener("input", () => {
      filtrarLista(input, selector);
    });

    clearBtn?.addEventListener("click", () => {
      input.value = "";
      filtrarLista(input, selector);
    });

  });

});


// =========================
// FILTRO GENÉRICO
// =========================
function filtrarLista(input, selector) {
  const items = document.querySelectorAll(selector);
  const texto = normalizar(input.value);

  items.forEach(el => {
    const contenido = normalizar(el.textContent);
    const coincide = contenido.includes(texto);

    el.style.display = coincide ? "" : "none";
  });
}


// =========================
// NORMALIZAR TEXTO (acentos)
// =========================
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
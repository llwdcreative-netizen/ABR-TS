document.getElementById("marcaSelect").addEventListener("change", async function() {
  const marca = this.value;
  const res = await fetch(`/api/productos?marca=${marca}`);
  const productos = await res.json();

  renderProductos(productos); // tu función que ya renderiza cards
});

async function cargarMarcas() {
  const res = await fetch("/api/marcas");
  const marcas = await res.json();

  const select = document.getElementById("marcaSelect");

  marcas.forEach(m => {
    const option = document.createElement("option");
    option.value = m;
    option.textContent = m;
    select.appendChild(option);
  });
}

cargarMarcas();
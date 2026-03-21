async function generarFiltros() {
  const contenedor = document.getElementById("filtros");
  const subContenedor = document.getElementById("subfiltros");

  // En la tienda no usamos categoriaSelect
  const esAdmin = !!document.getElementById("categoriaSelect");

  if (!contenedor || !subContenedor) return;

  if (esAdmin && !document.getElementById("categoriaSelect")) return;

  contenedor.innerHTML = "";
  subContenedor.innerHTML = "";

  const btnTodos = document.createElement("button");
  btnTodos.textContent = "Todos";
  btnTodos.onclick = () => {
    filtrarProductos();
    subContenedor.innerHTML = "";
  };
  contenedor.appendChild(btnTodos);

  const res = await fetch("/api/categorias");
  if (!res.ok) return console.error("Error al cargar categorías");
  const categorias = await res.json();

categorias.forEach(cat => {
  const boton = document.createElement("button");
  boton.textContent = cat.categoria;

  boton.onclick = () => {
    const url = new URL(window.location);
    url.searchParams.set("categoria", cat.categoria);
    window.history.pushState({}, "", url);

    filtrarProductos(cat.categoria);
    generarSubcategorias(cat);
  };

  contenedor.appendChild(boton);

  if (esAdmin) {
    const categoriaSelect = document.getElementById("categoriaSelect");
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.categoria;
    categoriaSelect.appendChild(option);
  }
});
}

// --- crear subcategoría ---
async function crearSubcategoria() {
  const categoria_id = document.getElementById("categoriaSelect")?.value;
  const sub = document.getElementById("nuevaSubcategoria")?.value.trim();

  if (!categoria_id || !sub) return alert("Seleccioná categoría y escribí subcategoría");

  const res = await fetch("/admin/api/subcategorias", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: sub, categoria_id })
  });

  if (res.ok) {
    alert("Subcategoría creada!");
    document.getElementById("nuevaSubcategoria").value = "";
    generarFiltros(); // recargar filtros y select
  } else {
    alert("Error al crear subcategoría");
  }
}

// --- generar botones de subcategorías ---
function generarSubcategorias(cat) {
  const contenedor = document.getElementById("subfiltros");
  if (!contenedor) return;

  contenedor.innerHTML = "";
  (cat.subcategorias || []).forEach(sub => {
    const boton = document.createElement("button");
    boton.textContent = sub;
    boton.onclick = () => filtrarProductos(cat.categoria, sub);
    contenedor.appendChild(boton);
  });
}

// --- filtrar productos ---
function filtrarProductos(cat, sub) {
  document.querySelectorAll(".producto").forEach(p => {

    const matchCat =
      !cat ||
      p.dataset.categoria.toLowerCase() === cat.toLowerCase();

    const matchSub =
      !sub ||
      p.dataset.subcategoria.toLowerCase() === sub.toLowerCase();

    p.classList.toggle("oculto", !(matchCat && matchSub));
  });
}
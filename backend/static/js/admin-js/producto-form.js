let categorias = [];

async function cargarShippingActual() {
  try {
    const res = await fetch("/api/shipping", {
      credentials: "include"
    });

    const data = await res.json();

    const input = document.getElementById("shippingCostInput");
    if (input) {
      input.value = data.shippingCost ?? 0;
    }

  } catch (err) {
    console.error("Error cargando shipping:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("JS CARGADO CORRECTAMENTE");

  await cargarShippingActual();

  const saveShippingBtn = document.getElementById("saveShipping");
  const shippingInput = document.getElementById("shippingCostInput");

if (saveShippingBtn) {
  saveShippingBtn.addEventListener("click", async () => {

    const valor = parseFloat(shippingInput.value);

  if (isNaN(valor) || valor < 0) {
    showNotification("Ingresá un valor válido.", "error");
    return;
  }

    try {
      const res = await fetch("/admin/api/shipping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          shippingCost: valor
        })
      });

      if (!res.ok) {
        const text = await res.text();
        showNotification("Error: " + text, "error");
        return;
      }

      showNotification("Costo de envío actualizado correctamente", "success");

    } catch (err) {
      console.error(err);
      showNotification("Error de red", "error");
    }

  });
}

  const form = document.getElementById("producto-form");
  if (!form) {

  const inputImagen = document.getElementById("imagen");
  const preview = document.getElementById("preview");

  if (inputImagen && preview) {
    inputImagen.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;

      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
    });
  }

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = form.nombre.value.trim();
  const descripcion = form.descripcion.value.trim();
  const precio = parseFloat(form.precio.value);
  const stock = parseInt(form.stock.value) || 0;
  const marcaId = document.getElementById("marca-select").value;
  const categoria = document.getElementById("categoria-select").value;
  const subcategoria = document.getElementById("subcategoria-select").value;



    if (!marcaId) {
      showNotification("Seleccioná una marca", "error");
      return;
    }

    if (!nombre || isNaN(precio)) {
      showNotification("Nombre y precio son obligatorios y válidos.", "error");
      return;
    }

  const formData = new FormData();


  formData.append("categoria", categoria);
  formData.append("subcategoria", subcategoria);
  formData.append("nombre", nombre);
  formData.append("descripcion", descripcion);
  formData.append("precio", precio);
  formData.append("stock", stock);
  formData.append("marca_id", marcaId);

  const fileInput = document.getElementById("imagen");

  console.log("FILES:", fileInput.files);
  console.log("FILES EN EL MOMENTO:", fileInput.files.length);
  if (fileInput.files.length > 0) {
    formData.append("imagen", fileInput.files[0]);
  }

  try {
    const res = await fetch("/producto-form", {
      method: "POST",
      credentials: "include",
      body: formData   // 🚨 SIN headers
    });

    if (!res.ok) {
      const text = await res.text();
      showNotification("Error al guardar producto: " + text, "error");
      return;
    }

    showNotification("Producto guardado correctamente", "success");

  } catch (err) {
    console.error(err);
    showNotification("Error de red al guardar producto", "error");
  }
});
}

async function cargarMarcas() {
  try {
    const res = await fetch("/api/marcas", { credentials: "include" });
    if (!res.ok) throw new Error("Error cargando marcas");

    const marcas = await res.json();

    const select = document.getElementById("marca-select");
    if (!select) return;

    select.innerHTML = `<option value="">Seleccionar marca</option>`;

    marcas.forEach(marca => {
      const option = document.createElement("option");
      option.value = marca.id;
      option.textContent = marca.nombre;
      select.appendChild(option);
    });

  } catch (err) {
    console.error("Error cargando marcas:", err);
  }
}

async function cargarCategoriasProducto() {

  try {

    const res = await fetch("/api/categorias");
    categorias = await res.json();

    const select = document.getElementById("categoria-select");
    if (!select) return;

    select.innerHTML = `<option value="">Seleccionar categoría</option>`;

    categorias.forEach(cat => {

      const option = document.createElement("option");
      option.value = cat.id;
      option.textContent = cat.categoria;

      select.appendChild(option);

    });

  } catch (err) {
    console.error("Error cargando categorías:", err);
  }

}

document.addEventListener("change", (e) => {

  if (e.target.id !== "categoria-select") return;

  const nombreCategoria = e.target.value;
  const subSelect = document.getElementById("subcategoria-select");

  if (!subSelect) return;

  subSelect.innerHTML = `<option value="">Subcategoría</option>`;

  const categoria = categorias.find(c => c.id == nombreCategoria);

  if (!categoria) return;

  categoria.subcategorias.forEach(sub => {

    const option = document.createElement("option");
    option.value = sub.id;
    option.textContent = sub.nombre;

    subSelect.appendChild(option);

  });

});


// Función para mostrar productos existentes
async function cargarProductos() {
  const container = document.getElementById("productos-list");
  if (!container) return;

  try {
    // 1. Traemos productos
    const res = await fetch("/admin/productos-json", { credentials: "include" });
    if (!res.ok) throw new Error("Error cargando productos");
    const productos = await res.json();

    //  2. Traemos marcas UNA sola vez
    const resMarcas = await fetch("/api/marcas", { credentials: "include" });
    if (!resMarcas.ok) throw new Error("Error cargando marcas");
    const marcas = await resMarcas.json();

    container.innerHTML = "";

    productos.forEach(p => {
      const div = document.createElement("div");
      div.classList.add("producto-item");

      div.innerHTML = `
      <div class="form-grid">
        <input value="${p.nombre}" class="edit-nombre" placeholder="Nombre del producto">
        <input type="number" value="${p.precio}" class="edit-precio" placeholder="Precio">
        <input type="number" value="${p.stock}" class="edit-stock" placeholder="Stock">

        <p> Seleccione una marca </p>
        <select class="edit-marca" placeholder="Seleccione una marca"></select>

        <p> Seleccione una categoría </p>
        <select class="edit-categoria" placeholder="Seleccione una categoría">
          <option value="">Categoría</option>
        </select>

        <p> Seleccione una subcategoría </p>
        <select class="edit-subcategoria">
          <option value="">Subcategoría</option>
        </select>

        <textarea class="edit-descripcion" placeholder="Agregue una descripción">${p.descripcion || ""}</textarea>

        <input type="file" class="edit-imagen-file" accept="image/*">
      </div>

        <img
          class="edit-preview"
          src="${p.imagen || ""}"
          style="max-width:200px; ${p.imagen ? "" : "display:none;"}"
        >

        <br>
        <button class="guardar">💾 Guardar</button>
        <button class="eliminar">🗑 Eliminar</button>
      `;

      //  Select de marcas
      const marcaSelect = div.querySelector(".edit-marca");

      marcas.forEach(marca => {
        const option = document.createElement("option");
        option.value = marca.id;
        option.textContent = marca.nombre;

        if (marca.id === p.marca_id) {
          option.selected = true;
        }

        marcaSelect.appendChild(option);
      });

      // Imagen preview
      const fileInput = div.querySelector(".edit-imagen-file");
      const previewImg = div.querySelector(".edit-preview");
      const categoriaSelect = div.querySelector(".edit-categoria");
      const subcategoriaSelect = div.querySelector(".edit-subcategoria");

      categorias.forEach(cat => {

        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.categoria;

        if (p.categoria_id === cat.id) {
          option.selected = true;
        }

        categoriaSelect.appendChild(option);

      });

      categoriaSelect.addEventListener("change", () => {

      const categoria = categorias.find(c => c.id == categoriaSelect.value);

      subcategoriaSelect.innerHTML = `<option value="">Subcategoría</option>`;

      if (!categoria) return;

      categoria.subcategorias.forEach(sub => {

        const option = document.createElement("option");
        option.value = sub.id;
        option.textContent = sub.nombre;

        subcategoriaSelect.appendChild(option);

      });

    });



  if (p.categoria_id) {
  categoriaSelect.value = p.categoria_id;

  const categoriaActual = categorias.find(c => c.id == p.categoria_id);

  subcategoriaSelect.innerHTML = `<option value="">Subcategoría</option>`;

  if (categoriaActual) {
    categoriaActual.subcategorias.forEach(sub => {
      const option = document.createElement("option");
      option.value = sub.id;
      option.textContent = sub.nombre;

      if (p.subcategoria_id === sub.id) {
        option.selected = true;
      }

      subcategoriaSelect.appendChild(option);
    });
  }
}




      const categoriaActual = categorias.find(c => c.id == p.categoria_id);

      if (categoriaActual) {

        subcategoriaSelect.innerHTML = `<option value="">Subcategoría</option>`;

        categoriaActual.subcategorias.forEach(sub => {

          const option = document.createElement("option");
          option.value = sub.id;
          option.textContent = sub.nombre;

          if (p.subcategoria_id === sub.id) {
            option.selected = true;
          }

          subcategoriaSelect.appendChild(option);

        });

      }

      fileInput.addEventListener("change", e => {
        const file = e.target.files[0];
        if (!file) return;

        previewImg.src = URL.createObjectURL(file);
        previewImg.style.display = "block";
      });

      // EDITAR
      div.querySelector(".guardar").onclick = async () => {

        const formData = new FormData();

        formData.append("nombre", div.querySelector(".edit-nombre").value);
        formData.append("descripcion", div.querySelector(".edit-descripcion").value);
        formData.append("precio", div.querySelector(".edit-precio").value);
        formData.append("stock", div.querySelector(".edit-stock").value);
        formData.append("marca_id", marcaSelect.value);
        formData.append("categoria_id", categoriaSelect.value);
        formData.append("subcategoria_id", subcategoriaSelect.value);

        if (fileInput.files.length > 0) {
          formData.append("imagen", fileInput.files[0]);
        }

        const res = await fetch(`/admin/productos/${p.id}/editar`, {
          method: "POST",
          credentials: "include",
          body: formData
        });

      if (!res.ok) {
        const text = await res.text();
        showNotification("Error: " + text, "error");
        return;
      }

      showNotification("Producto actualizado correctamente", "success");

      await cargarProductos();
      };

      // ELIMINAR
div.querySelector(".eliminar").onclick = async () => {
  if (!confirm("¿Eliminar producto?")) return;

  try {
    const res = await fetch(`/admin/productos/${p.id}/eliminar`, {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      showNotification("Error al eliminar producto", "error");
      return;
    }

    // animación opcional
    div.style.transition = "all 0.3s ease";
    div.style.opacity = "0";
    div.style.transform = "scale(0.95)";

    setTimeout(() => {
      div.remove();
    }, 300);

    showNotification("Producto eliminado correctamente", "success");

  } catch (err) {
    console.error(err);
    showNotification("Error de red", "error");
  }
};

      container.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error cargando productos</p>";
  }
}

  // Cargar productos al inicio
  await cargarCategoriasProducto();
  cargarProductos();
  cargarMarcas();
  cargarCategoriasAdmin();
});

async function crearCategoria(){

  const nombre = document.getElementById("nuevaCategoria").value;

  await fetch("/admin/api/categorias",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({nombre})
  });

  showNotification("Categoría creada", "success");

  await cargarCategoriasProducto();
  await cargarCategoriasAdmin();
}

async function crearSubcategoria(){

  const nombre = document.getElementById("nuevaSubcategoria").value;
  const categoria_id = document.getElementById("categoriaSelect").value;

  await fetch("/admin/api/subcategorias",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({nombre,categoria_id})
  });

  showNotification("Subcategoría creada", "success");

  await cargarCategoriasProducto();
  await cargarCategoriasAdmin();
}

async function cargarCategoriasAdmin() {
  const res = await fetch("/api/categorias");
  if (!res.ok) return console.error("Error cargando categorías");

  const categorias = await res.json();
  const select = document.getElementById("categoriaSelect");
  if (!select) return;

  select.innerHTML = '<option value="">Seleccionar categoría</option>';

  categorias.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.id; // siempre el ID
    option.textContent = cat.categoria;
    select.appendChild(option);
  });
}



/*-------------- BOTONES PESTAÑA --------------*/
const buttons = document.querySelectorAll(".tab-btn");

buttons.forEach(button => {

  button.addEventListener("click", () => {

    const target = button.dataset.target;

    // ocultar todas las secciones
    document
      .querySelectorAll("#productos, #crear, #shipping")
      .forEach(section => section.classList.add("tab-hidden"));

    // mostrar sección seleccionada
    document
      .getElementById(target)
      .classList.remove("tab-hidden");

    // estado activo
    buttons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

  });

});

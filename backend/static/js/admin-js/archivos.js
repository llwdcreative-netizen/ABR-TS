// -----------------------------
// BOTÓN
// -----------------------------
function botonArchivar(pedido) {
  return `
    <button class="btn-archivar" onclick="toggleArchivar(${pedido.id})">
      ${pedido.archivado ? "📤 Desarchivar" : "🗂 Archivar"}
    </button>
  `;
}

// -----------------------------
// TOGGLE ARCHIVAR
// -----------------------------
async function toggleArchivar(id) {
  const res = await fetch(`/admin/pedidos/${id}/archivar`, {
    method: "POST",
    credentials: "include"
  });

  if (!res.ok) {
    alert("Error");
    return;
  }

  const btn = document.querySelector(`button[onclick="toggleArchivar(${id})"]`);
  if (!btn) return;

  const card = btn.closest(".pedido-card");
  if (!card) return;

  // 🎬 animación
  card.style.transition = "all 0.3s ease";
  card.style.opacity = "0";
  card.style.transform = "translateY(-10px) scale(0.98)";

  setTimeout(() => {
    card.remove();
  }, 300);
}

// -----------------------------
// CARGAR DATOS
// -----------------------------
async function cargarPedidosAdmin() {
  try {
    const [activosRes, archivadosRes] = await Promise.all([
      fetch("/admin/api/pedidos?archivado=false", { credentials: "include" }),
      fetch("/admin/api/pedidos?archivado=true", { credentials: "include" })
    ]);

    const activos = await activosRes.json();
    const archivados = await archivadosRes.json();

    renderLista("lista-activos", activos);
    renderLista("lista-archivados", archivados);

  } catch (err) {
    console.error("Error:", err);
  }
}

// -----------------------------
// RENDER
// -----------------------------
function renderLista(id, pedidos) {
  const contenedor = document.getElementById(id);
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (!pedidos.length) {
    contenedor.innerHTML = `<p style="opacity:0.6;">No hay pedidos</p>`;
    return;
  }

  pedidos.forEach(p => {
    const div = document.createElement("div");
    div.className = "pedido-card";

    div.innerHTML = `
      <div class="pedido-header">
        <strong>#${p.id}</strong>
        <span>${p.estado}</span>
      </div>

      <div>
        👤 ${p.nombre || "—"} <br>
        💰 $${p.total} <br>
        📅 ${p.fecha}
      </div>

      <div class="pedido-acciones">
        ${botonArchivar(p)}
      </div>
    `;

    contenedor.appendChild(div);
  });
}

// -----------------------------
// TABS
// -----------------------------
function initTabs() {
  const tabActivos = document.getElementById("tab-activos");
  const tabArchivados = document.getElementById("tab-archivados");

  const listaActivos = document.getElementById("lista-activos");
  const listaArchivados = document.getElementById("lista-archivados");

  tabActivos.addEventListener("click", () => {
    tabActivos.classList.add("active");
    tabArchivados.classList.remove("active");

    listaActivos.style.display = "block";
    listaArchivados.style.display = "none";
  });

  tabArchivados.addEventListener("click", () => {
    tabArchivados.classList.add("active");
    tabActivos.classList.remove("active");

    listaArchivados.style.display = "block";
    listaActivos.style.display = "none";
  });
}

// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  cargarPedidosAdmin();
  initTabs();
});
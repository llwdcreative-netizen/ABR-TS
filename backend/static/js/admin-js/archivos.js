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

  // 🔥 buscar la card
  const btn = document.querySelector(`button[onclick="toggleArchivar(${id})"]`);
  if (!btn) return;

  const card = btn.closest(".pedido-card");
  if (!card) return;

  // 🎬 animación suave
  card.style.transition = "all 0.3s ease";
  card.style.opacity = "0";
  card.style.transform = "translateY(-10px) scale(0.98)";

  setTimeout(() => {
    card.remove();
  }, 300);
}

// -----------------------------
// CARGAR SOLO ARCHIVADOS
// -----------------------------
async function cargarPedidosAdmin() {
  console.log("PEDIDOS ARCHIVADOS:", pedidos);
  try {
    const res = await fetch("/admin/api/pedidos?archivado=true", {
      credentials: "include"
    });

    if (!res.ok) {
      console.error("Error al cargar pedidos");
      return;
    }

    const pedidos = await res.json();
    renderLista("lista-archivados", pedidos);

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
    contenedor.innerHTML = `<p style="opacity:0.6;">No hay pedidos archivados</p>`;
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
document.addEventListener("DOMContentLoaded", cargarPedidosAdmin);
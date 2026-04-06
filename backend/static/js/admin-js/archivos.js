const activos = pedidos.filter(p => !p.archivado);

const archivados = pedidos.filter(p => p.archivado);

function botonArchivar(pedido) {
  return `
    <button onclick="toggleArchivar(${pedido.id})">
      ${pedido.archivado ? "📤 Desarchivar" : "🗂 Archivar"}
    </button>
  `;
}

async function toggleArchivar(id) {
  const res = await fetch(`/admin/pedidos/${id}/archivar`, {
    method: "POST",
    credentials: "include"
  });

  if (res.ok) {
    location.reload();
  } else {
    alert("Error");
  }
}

async function cargarPedidosAdmin() {
  const res = await fetch("/admin/api/pedidos", {
    credentials: "include"
  });

  const pedidos = await res.json();

  const activos = pedidos.filter(p => !p.archivado);
  const archivados = pedidos.filter(p => p.archivado);

  renderLista("lista-activos", activos);
  renderLista("lista-archivados", archivados);
}

function renderLista(id, pedidos) {
  const contenedor = document.getElementById(id);
  contenedor.innerHTML = "";

  pedidos.forEach(p => {
    const div = document.createElement("div");
    div.className = "pedido-card";

    div.innerHTML = `
      <div class="pedido-header">
        <strong>#${p.id}</strong>
        <span>${p.estado}</span>
      </div>

      <div>
        👤 ${p.nombre} <br>
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
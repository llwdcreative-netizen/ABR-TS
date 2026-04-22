async function cargarEnviosAdmin() {
  const res = await fetch("/admin/api/pedidos?tipo=envio&archivado=false", {
    credentials: "include"
  });

  if (!res.ok) {
    console.error("Error cargando pedidos");
    return;
  }

  const pedidos = await res.json();
  const tbody = document.getElementById("tabla-envios");
  tbody.innerHTML = "";

  pedidos.forEach(p => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.fecha}</td>
      <td>${p.nombre || p.cliente?.nombre || "-"}</td>
      <td>$ ${p.total}</td>
      <td>
        <div style="display:flex; gap:8px; align-items:center;">  
          <span style="color:${colorEstado(p.estado)}; font-weight:bold;">
            ${textoEstado(p.estado)}
          </span>

          <select onchange="cambiarEstado('${p.tipo}', ${p.id}, this.value)">
            ${opcionesEnvio(p.estado)}
          </select>
        </div>
      </td>
      <td>
        <a href="/admin/envio/${p.envio_id}">Ver</a>
      </td>
      <td>
      <button onclick="toggleArchivar(${p.id})" class="arch-button">
        🗂 Archivar
      </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}


async function toggleArchivar(id) {
  const res = await fetch(`/admin/pedidos/${id}/archivar`, {
    method: "POST",
    credentials: "include"
  });

  if (res.ok) {
    showNotification("Pedido archivado", "success");
    const btn = document.querySelector(`button[onclick="toggleArchivar(${id})"]`);
    const row = btn.closest("tr");

    if (row) {
      row.style.transition = "all 0.3s ease";
      row.style.opacity = "0";
      row.style.transform = "translateX(-20px)";

      setTimeout(() => {
        row.remove();
      }, 300);
    }

  } else {
    showNotification("Error al archivar pedido", "error");
  }
}
// =========================
// ESTADO
// =========================
function opcionesEnvio(actual) {
  const estados = [
  "PENDIENTE_PAGO",
  "PENDIENTE",
  "EN_CAMINO",
  "ENTREGADO",
  "CANCELADO"
];

  return estados.map(e =>
    `<option value="${e}" ${e === actual ? "selected" : ""}>
      ${textoEstado(e)}
    </option>`
  ).join("");
}

async function cambiarEstado(id, estado) {
  const res = await fetch(`/admin/pedidos/${id}/estado`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado })
  });

  const data = await res.json();

  if (data.ok) {
    showNotification("Estado actualizado", "success");
    cargarEnviosAdmin();
  } else {
    showNotification("Error al actualizar estado", "error");
  }
}

function textoEstado(estado) {
  return {
    PENDIENTE_PAGO: "Pendiente de pago",
    PENDIENTE: "Pendiente",
    EN_CAMINO: "En camino",
    ENTREGADO: "Entregado",
    CANCELADO: "Cancelado"
  }[estado] || estado;
}

function colorEstado(estado) {
  return {
    PENDIENTE_PAGO: "#e67e22",
    PENDIENTE: "#dbc234",
    EN_CAMINO: "#3498db",
    ENTREGADO: "#27ae60",
    CANCELADO: "#e74c3c"
  }[estado] || "#000";
}

document.addEventListener("DOMContentLoaded", cargarEnviosAdmin);


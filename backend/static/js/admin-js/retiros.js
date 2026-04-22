async function cargarRetirosAdmin() {
  const res = await fetch("/admin/api/pedidos?tipo=retiro&archivado=false", {
    credentials: "include"
  });

  if (!res.ok) {
    console.error("Error cargando pedidos");
    return;
  }

  const pedidos = await res.json();
  const tbody = document.getElementById("tabla-retiros");
  tbody.innerHTML = "";

  pedidos.forEach(p => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.fecha}</td>
        <td>${p.nombre || "-"}</td>
        <td>$ ${p.total}</td>
        <td>
          <div style="display:flex; gap:8px; align-items:center;">  
            <span style="color:${colorEstadoRetiro(p.estado)}; font-weight:bold;">
              ${textoEstadoRetiro(p.estado)}
            </span>

            <select onchange="cambiarEstado(${p.id}, this.value)">
              ${opcionesRetiro(p.estado)}
            </select>
          </div>
        </td>
        <td>
          <a href="/admin/retiro/${p.id}">Ver</a>
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
    document.querySelector(`button[onclick="toggleArchivar(${id})"]`)
      .closest("tr")
      .remove();

    showNotification(`Pedido #${id} archivado`, "success");
  } else {
    showNotification("Error al archivar el pedido", "error");
  }
}
// =========================
// ESTADO RETIRO
// =========================

function opcionesRetiro(actual) {
  const estados = [
  "PENDIENTE",
  "LISTO_PARA_RETIRAR",
  "RETIRADO",
  "CANCELADO"
];

  return estados.map(e =>
    `<option value="${e}" ${e === actual ? "selected" : ""}>
      ${textoEstadoRetiro(e)}
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
    showNotification(`Estado actualizado a ${estado}`, "success");
    await cargarRetirosAdmin();
  } else {
    showNotification("Error al actualizar el estado", "error");
  }
}

function textoEstadoRetiro(estado) {
  return {
    PENDIENTE: "Pendiente",
    LISTO_PARA_RETIRAR: "Listo para retirar",
    RETIRADO: "Retirado",
    CANCELADO: "Cancelado"
  }[estado] || estado;
}

function colorEstadoRetiro(estado) {
  return {
    PENDIENTE: "#dbc234",
    LISTO_PARA_RETIRAR: "#80E067",
    RETIRADO: "#616161",
    CANCELADO: "#e74c3c"
  }[estado] || "#000";
}

document.addEventListener("DOMContentLoaded", cargarRetirosAdmin);


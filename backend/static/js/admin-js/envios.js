async function cargarEnviosAdmin() {
  const res = await fetch("/admin/api/pedidos?tipo=envio", {
    credentials: "include"
  });

  if (!res.ok) {
    console.error("Error al cargar pedidos");
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
    `;

    tbody.appendChild(tr);
  });
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

async function cambiarEstado(tipo, id, estado) {
  const res = await fetch(`/admin/pedidos/${tipo}/${id}/estado`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado })
  });

  const data = await res.json();

  if (data.ok) {
    cargarEnviosAdmin(); // 🔥 recarga automática
  } else {
    alert("Error al actualizar");
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


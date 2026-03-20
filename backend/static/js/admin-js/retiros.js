async function cargarRetirosAdmin() {
  const res = await fetch("/admin/api/pedidos?tipo=retiro", {
    credentials: "include"
  });

  if (!res.ok) {
    console.error("Error al cargar pedidos");
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
        <td>${p.cliente?.nombre || "-"}</td>
        <td>$ ${p.total}</td>
        <td>
          <div style="display:flex; gap:8px; align-items:center;">  
            <span style="color:${colorEstadoRetiro(p.estado)}; font-weight:bold;">
              ${textoEstadoRetiro(p.estado)}
            </span>

            <select onchange="cambiarEstado('${p.tipo}', ${p.id}, this.value)">
              ${opcionesRetiro(p.estado)}
            </select>
          </div>
        </td>
        <td>
          <a href="/admin/retiro/${p.id}">Ver</a>
        </td>
    `;

    tbody.appendChild(tr);
  });
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

async function cambiarEstado(tipo, id, estado) {
  const res = await fetch(`/admin/pedidos/${tipo}/${id}/estado`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado })
  });

  const data = await res.json();

  if (data.ok) {
    await cargarRetirosAdmin(); // 🔥 recarga SOLO la tabla
  } else {
    alert("Error al actualizar");
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


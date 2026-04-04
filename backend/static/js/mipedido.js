async function cargarPedido() {
  const params = new URLSearchParams(window.location.search);

  const id = params.get("id");

  if (!id) {
    throw new Error("ID faltante");
  }

  const res = await fetch(`/pedido/${id}`, {
    credentials: "include"
  });

  if (!res.ok) {
    throw new Error("Pedido no encontrado");
  }

  const pedido = await res.json();

  // =========================
  // DATOS GENERALES
  // =========================
  document.getElementById("pedido-id").textContent = pedido.id;
  document.getElementById("pedido-fecha").textContent = pedido.fecha;
  document.getElementById("pedido-total").textContent = `$ ${pedido.total}`;

  // =========================
  // ESTADO
  // =========================
  const estadoElem = document.getElementById("pedido-estado");

  estadoElem.textContent = textoEstado(pedido.estado);
  estadoElem.style.color = colorEstado(pedido.estado);


  
  // =========================
  // CANCELAR PEDIDO
  // =========================
const contenedorAcciones = document.getElementById("pedido-acciones");

contenedorAcciones.innerHTML = "";

if (
  pedido.estado === "PENDIENTE" || 
  pedido.estado === "PENDIENTE_PAGO"
) {
  contenedorAcciones.innerHTML = `
    <button onclick="cancelarPedido(event, ${pedido.id})">
      ❌ Cancelar pedido
    </button>
  `;
}

  // =========================
  // PRODUCTOS
  // =========================
  const lista = document.getElementById("pedido-productos");
  lista.innerHTML = "";

  pedido.productos.forEach(p => {
    const nombre = p.nombre || p.name || p.item || "Producto";
    const cantidad = p.cantidad || p.qty || 1;
    const precio = p.precio || p.price || 0;

    const li = document.createElement("li");
    li.textContent = `${nombre} x${cantidad} — $${precio * cantidad}`;
    lista.appendChild(li);
  });
}


/*---------------------- CANCELAR PEDIDO -------------------------*/

async function cancelarPedido(e, id) {
  e.stopPropagation();

  if (!confirm("¿Cancelar este pedido?")) return;

  const btn = e.target;
  btn.disabled = true;

  try {
    const res = await fetch(`/pedidos/${id}/cancelar`, {
      method: "POST",
      credentials: "include"
    });

    if (!res.ok) throw new Error();

    const data = await res.json();

    if (data.ok) {
      alert("Pedido cancelado");
      location.reload();
    } else {
      throw new Error(data.error);
    }

  } catch {
    alert("Error al cancelar");
    btn.disabled = false;
  }
}



// =========================
// COLORES DE ESTADO
// =========================
function textoEstado(estado) {
  if (!estado) return "-";

  estado = estado.toUpperCase();

  return {
    PENDIENTE: "Pendiente",
    EN_CAMINO: "En camino",
    ENTREGADO: "Entregado",
    CANCELADO: "Cancelado",
    RETIRADO: "Retirado",
  }[estado] || estado;
}


function colorEstado(estado) {
  if (!estado) return "#000";

  estado = estado.toUpperCase();

  return {
    PENDIENTE: "#dbc234",
    EN_CAMINO: "#3498db",
    ENTREGADO: "#27ae60",
    CANCELADO: "#e74c3c",
    RETIRADO: "#8e44ad",
  }[estado] || "#000";
}

document.addEventListener("DOMContentLoaded", cargarPedido);
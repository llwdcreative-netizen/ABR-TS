async function cargarEnvioAdmin() {
  const partes = window.location.pathname.split("/");
  const id = partes.at(-1);

  if (!id || isNaN(id)) return;

  const res = await fetch(`/admin/api/envios/${id}`, {
    credentials: "include"
  });

  if (!res.ok) {
    alert("Pedido no encontrado");
    return;
  }

  const p = await res.json();

  // Pedido
  document.getElementById("pedido-id").textContent = p.id;
  document.getElementById("pedido-fecha").textContent = p.fecha;
  document.getElementById("pedido-total").textContent = p.total;
  document.getElementById("pedido-estado").textContent = p.estado;

  // Cliente
  document.getElementById("cliente-nombre").textContent = p.nombre;
  document.getElementById("cliente-telefono").textContent = p.telefono;
  document.getElementById("cliente-email").textContent = p.email;

  // Dirección
  document.getElementById("direccion-calle").textContent = p.calle;
  document.getElementById("direccion-numero").textContent = p.numero;
  document.getElementById("direccion-piso").textContent =
    p.piso ? `Piso ${p.piso}` : "";

  document.getElementById("direccion-barrio").textContent = p.barrio;
  document.getElementById("direccion-ciudad").textContent = p.ciudad;
  document.getElementById("direccion-provincia").textContent = p.provincia;
  document.getElementById("direccion-cp").textContent = p.cp;

  // Notas
  document.getElementById("pedido-notas").textContent =
    p.notas || "—";

  // Productos
  const ul = document.getElementById("pedido-productos");
  ul.innerHTML = "";

  p.productos.forEach(prod => {
    const li = document.createElement("li");
    li.textContent = `${prod.name} x${prod.cantidad} — $${prod.price * prod.cantidad}`;
    ul.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", cargarEnvioAdmin);

async function actualizarEstadoEnvio() {
  const partes = window.location.pathname.split("/");
  const id = partes.at(-1);

  const nuevoEstado = document.getElementById("cambiar-estado").value;

  const res = await fetch(`/admin/pedidos/envio/${id}/estado`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ estado: nuevoEstado })
  });

  const data = await res.json();

  if (data.ok) {
    document.getElementById("pedido-estado").textContent = nuevoEstado;
    alert("Estado actualizado");
  } else {
    alert(data.error || "Error al actualizar estado");
  }
}

document.getElementById("btn-estado")
  ?.addEventListener("click", actualizarEstadoEnvio);

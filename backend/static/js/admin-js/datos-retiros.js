async function cargarRetiroAdmin() {
  const partes = window.location.pathname.split("/").filter(Boolean);
  const id = partes.at(-1);

  if (!id || isNaN(id)) return;

  const res = await fetch(`/admin/api/retiros/${id}`, {
    credentials: "include"
  });

  if (!res.ok) {
    showNotification("Error del servidor", "error");
    return;
  }

const data = await res.json();

  // =========================
  // Datos básicos del retiro
  // =========================
  document.getElementById("pedido-id").textContent = data.id;
  document.getElementById("pedido-fecha").textContent = data.fecha;
  document.getElementById("pedido-total").textContent = data.total;
  document.getElementById("pedido-estado").textContent = data.estado;
  document.getElementById("cambiar-estado").value = data.estado;


  // =========================
  // Cliente (puede venir como JSON string)
  // =========================
  try {
    const cliente = typeof data.cliente === "string"
      ? JSON.parse(data.cliente)
      : data.cliente;

    document.getElementById("cliente-nombre").textContent =
      cliente?.nombre || "—";
  } catch (err) {
    document.getElementById("cliente-nombre").textContent =
      data.cliente || "—";
  }

  // =========================
  // Productos
  // =========================
  const ul = document.getElementById("pedido-productos");
  ul.innerHTML = "";

  if (data.productos && Array.isArray(data.productos)) {
    data.productos.forEach(prod => {
      const li = document.createElement("li");

      const nombre = prod.nombre || prod.name || "Producto";
      const cantidad = prod.cantidad || 1;

      li.textContent = `${nombre} x${cantidad}`;
      ul.appendChild(li);
    });
  }
}


async function actualizarEstadoRetiro() {
  try {
    const partes = window.location.pathname.split("/");
    const id = partes.at(-1);

    const nuevoEstado = document.getElementById("cambiar-estado").value;

    const res = await fetch(`/admin/pedidos/${id}/estado`, {
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
      document.getElementById("cambiar-estado").value = nuevoEstado;

      showNotification("Estado actualizado correctamente", "success");
    } else {
      showNotification(data.error || "Error al actualizar estado", "error");
    }

  } catch (err) {
    console.error(err);
    showNotification("Error de conexión", "error");
  }
}


document.addEventListener("DOMContentLoaded", () => {
  cargarRetiroAdmin();

  document
    .getElementById("btn-estado")
    ?.addEventListener("click", actualizarEstadoRetiro);
});
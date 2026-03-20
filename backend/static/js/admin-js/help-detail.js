async function cargarMensaje() {
    const MSG_ID = document.body.dataset.msgId;
      if (!MSG_ID) {
    console.error("ID de mensaje no encontrado");
    return;
  }
  const res = await fetch(`/admin/api/help/${MSG_ID}`, {
    credentials: "include"
  });

  if (!res.ok) return;

  const m = await res.json();

  document.getElementById("msg-id").textContent = m.id;
  document.getElementById("msg-nombre").textContent =
    `${m.nombre} ${m.apellido}`;
  document.getElementById("msg-email").textContent = m.email;
  document.getElementById("msg-telefono").textContent = m.telefono || "-";
  document.getElementById("msg-texto").textContent = m.mensaje;
}

document.addEventListener("DOMContentLoaded", cargarMensaje);

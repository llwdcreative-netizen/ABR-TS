async function cargarMensajes() {
  const res = await fetch("/admin/api/help", {
    credentials: "include"
  });

  const mensajes = await res.json();
  const tbody = document.getElementById("tabla-help");
  tbody.innerHTML = "";

  mensajes.forEach(m => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${m.id}</td>
      <td>${m.nombre} ${m.apellido}</td>
      <td>${m.email}</td>
      <td>${m.fecha}</td>
      <td>
        <a href="/admin/help/${m.id}">Ver</a>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", cargarMensajes);

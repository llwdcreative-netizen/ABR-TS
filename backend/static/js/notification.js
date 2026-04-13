// ===============================
// 🔔 NOTIFICACIONES CLIENTE
// ===============================

async function marcarLeidasCliente() {
  try {
    await fetch(`/notificaciones/usuario/marcar-leidas`, {
      method: "POST",
      credentials: "include"
    });

    await cargarNotificacionesCliente();
    actualizarNotificacionesCount();

  } catch (err) {
    console.error("Error marcando notificaciones:", err);
  }
}

async function cargarNotificacionesCliente() {
  try {
    const res = await fetch(`/notificaciones`, {
      credentials: "include"
    });
    const data = await res.json();

    const lista = document.getElementById("notificationList");
    const count = document.getElementById("notificationCount");

    lista.innerHTML = "";

    let noLeidas = 0;

    if (data.length === 0) {
      lista.innerHTML =
        "<p style='padding:15px;color:#aaa;'>No tienes notificaciones</p>";
      count.style.display = "none";
      actualizarNotificacionesCount();
      return;
    }

    data.forEach(n => {

      if (!n.leida) noLeidas++; 

      const div = document.createElement("div");
      div.classList.add("notification-item");

      if (!n.leida) {
        div.classList.add("unread");
      }

      const fecha = new Date(n.fecha).toLocaleString();

      div.innerHTML = `
        <strong>${n.titulo}</strong>
        <p>${n.mensaje}</p>
        <span class="time">${fecha}</span>
      `;

      div.addEventListener("click", () => {
        const id = n.referencia_id;
        if (!id) return;

        window.location.href = `/mipedido?id=${id}`;
      });

      lista.appendChild(div);
    });

    // contador local panel
    if (noLeidas > 0) {
      count.style.display = "inline-block";
      count.textContent = noLeidas;
    } else {
      count.style.display = "none";
    }

    actualizarNotificacionesCount(); 
  } catch (err) {
    console.error("Error cargando notificaciones:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("notificationBtn");
  const panel = document.getElementById("notificationPanel");
  const clearBtn = document.getElementById("clearNotifications");

  cargarNotificacionesCliente();

  btn.addEventListener("click", async () => {
    panel.classList.toggle("hidden");

    if (!panel.classList.contains("hidden")) {
      await marcarLeidasCliente();
    }
  });

  document.addEventListener("click", (e) => {
    if (!btn.contains(e.target) && !panel.contains(e.target)) {
      panel.classList.add("hidden");
    }
  });

clearBtn.addEventListener("click", async () => {
  try {
    await fetch(`/notificaciones/usuario/limpiar`, {
      method: "DELETE",
      credentials: "include"
    });

    await cargarNotificacionesCliente();
    actualizarNotificacionesCount(); 

  } catch (err) {
    console.error("Error limpiando notificaciones:", err);
  }
});
});

setInterval(() => {
  const panel = document.getElementById("notificationPanel");

  if (!panel.classList.contains("hidden")) {
    cargarNotificacionesCliente();
  }

  actualizarNotificacionesCount();
}, 5000);


async function actualizarNotificacionesCount() {
  const badge = document.getElementById("notif-count");
  if (!badge) return;

  try {
    const res = await fetch("/notificaciones/count", {
      credentials: "include"
    });

    const data = await res.json();
    const total = data.count || 0;

    if (total > 0) {
      badge.textContent = total;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }

  } catch (e) {
    console.error(e);
  }
}
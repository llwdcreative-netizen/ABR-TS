// ===============================
// 🔔 NOTIFICACIONES CLIENTE
// ===============================

async function cargarNotificacionesCliente() {
  try {
    const res = await fetch(`/notificaciones`);
    const data = await res.json();

    const lista = document.getElementById("notificationList");
    const count = document.getElementById("notificationCount");

    lista.innerHTML = "";

    let noLeidas = 0;

    if (data.length === 0) {
      lista.innerHTML =
        "<p style='padding:15px;color:#aaa;'>No tienes notificaciones</p>";
      count.style.display = "none";
      return;
    }

    data.forEach(n => {
      if (n.leida) noLeidas++;

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

      // 🔥 Redirección cliente
      div.addEventListener("click", () => {
        const id = n.referencia_id;
        if (!id) return;

        window.location.href = `/mipedido?id=${id}`;
      });

      lista.appendChild(div);
    });

    // 🔴 Contador
    if (noLeidas > 0) {
      count.style.display = "inline-block";
      count.textContent = noLeidas;
    } else {
      count.style.display = "none";
    }

  } catch (err) {
    console.error("Error cargando notificaciones:", err);
  }
}

async function marcarLeidasCliente() {
  try {
    await fetch(`/notificaciones/marcar-leidas`, {
      method: "POST"
    });

    cargarNotificacionesCliente();

  } catch (err) {
    console.error("Error marcando notificaciones:", err);
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

      cargarNotificacionesCliente();
    } catch (err) {
      console.error("Error limpiando notificaciones:", err);
    }
  });

});
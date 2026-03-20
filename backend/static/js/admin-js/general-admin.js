document.addEventListener("DOMContentLoaded", () => {

  // ========================
  // 🔐 LOGOUT
  // ========================
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await fetch("http://127.0.0.1:5000/admin/logout", {
        method: "POST",
        credentials: "include"
      });
      window.location.href = "/admin/login";
    });
  }

  // ========================
  // 🍔 MENÚ HAMBURGUESA
  // ========================
  const menuBtn = document.getElementById("adminMenuBtn");
  const sidebar = document.querySelector(".admin-sidebar");

  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", (e) => {
      sidebar.classList.toggle("active");
      e.stopPropagation();
    });

    document.addEventListener("click", (e) => {
      if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        sidebar.classList.remove("active");
      }
    });

    document.querySelectorAll(".admin-sidebar a").forEach(link => {
      link.addEventListener("click", () => {
        sidebar.classList.remove("active");
      });
    });
  }

  // ========================
  // 🔔 NOTIFICACIONES
  // ========================
  const btn = document.getElementById("notificationBtn");
  const panel = document.getElementById("notificationPanel");
  const lista = document.getElementById("notificationList");
  const count = document.getElementById("notificationCount");
  const clearBtn = document.getElementById("clearNotifications");

  if (!btn || !panel || !lista || !count) return;

  // 🔄 Cargar notificaciones
  async function cargarNotificaciones() {
    try {
      const res = await fetch(`/notificaciones?rol=admin`);
      const data = await res.json();

      lista.innerHTML = "";
      let noLeidas = 0;

      if (!Array.isArray(data) || data.length === 0) {
        lista.innerHTML =
          "<p style='padding:15px;color:#aaa;'>No tienes notificaciones</p>";
        count.style.display = "none";
        return;
      }

      data.forEach(n => {
        if (!n.leida) noLeidas++;

        const div = document.createElement("div");
        div.classList.add("notification-item");

        if (!n.leida) div.classList.add("unread");

        div.innerHTML = `
          <strong>${n.titulo}</strong>
          <p>${n.mensaje}</p>
          <span class="time">${n.fecha}</span>
        `;

        div.addEventListener("click", () => {
          const id = n.referencia_id;
          if (!id) return;

          if (n.tipo === "envio") {
            window.location.href = `/admin/envios/${id}`;
          } else if (n.tipo === "retiro") {
            window.location.href = `/admin/retiros/${id}`;
          } else if (n.tipo === "contact") {
            window.location.href = `/admin/help/${id}`;
          }
        });

        lista.appendChild(div);
      });

      // 🔴 contador
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

  // 🟢 Marcar como leídas
  async function marcarLeidas() {
    try {
      await fetch("/notificaciones/marcar-leidas", {
        method: "POST"
      });
      cargarNotificaciones();
    } catch (err) {
      console.error("Error marcando notificaciones:", err);
    }
  }

  // ========================
  // 🎛 EVENTOS UI
  // ========================

  // 🔄 cargar al iniciar
  cargarNotificaciones();

  // 🔔 abrir / cerrar
  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    panel.classList.toggle("hidden");

    if (!panel.classList.contains("hidden")) {
      await marcarLeidas();
    }
  });

  // ❌ cerrar al click afuera
  document.addEventListener("click", (e) => {
    if (!btn.contains(e.target) && !panel.contains(e.target)) {
      panel.classList.add("hidden");
    }
  });

  // 🧹 limpiar notificaciones
  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      try {
        const res = await fetch("/notificaciones/limpiar", {
          method: "DELETE",
          credentials: "include"

        });

        const data = await res.json();

        if (data.success) {
          lista.innerHTML =
            "<p style='padding:15px;color:#aaa;'>No hay notificaciones</p>";
          count.style.display = "none";
        }

      } catch (err) {
        console.error("Error limpiando notificaciones", err);
      }
    });
  }

});
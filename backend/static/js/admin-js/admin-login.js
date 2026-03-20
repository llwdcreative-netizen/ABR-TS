document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("admin-login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      // Llamada al login admin
      const res = await fetch("/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      const data = await res.json(); // parseamos JSON

      if (!data.ok) {
        document.getElementById("error").textContent =
          data.error || "Error de acceso";
        return;
      }

      // 🔐 éxito → redirigir al panel
      window.location.href = "/admin";

    } catch (err) {
      console.error("Error en login admin:", err);
      document.getElementById("error").textContent =
        "Error de conexión o inesperado";
    }
  });
});

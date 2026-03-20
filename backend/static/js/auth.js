document.addEventListener("DOMContentLoaded", async () => {

  // =============================
  // VERIFICAR SESIÓN EXISTENTE
  // =============================
  try {
    const res = await fetch("/me", {
      credentials: "include"
    });
    const data = await res.json();

    if (data.logged) {
      window.location.href = "/dashboard";
      return;
    }
  } catch (err) {
    console.error("No se pudo verificar la sesión:", err);
  }

  // =============================
  // CAMBIO DE PESTAÑAS
  // =============================
  const loginTab = document.getElementById("login-tab");
  const registerTab = document.getElementById("register-tab");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  if (loginTab && registerTab && loginForm && registerForm) {
    loginTab.addEventListener("click", () => {
      loginTab.classList.add("active");
      registerTab.classList.remove("active");
      loginForm.classList.add("active");
      registerForm.classList.remove("active");
    });

    registerTab.addEventListener("click", () => {
      registerTab.classList.add("active");
      loginTab.classList.remove("active");
      registerForm.classList.add("active");
      loginForm.classList.remove("active");
    });
  }

  // =============================
  // REGISTRO
  // =============================
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombre = document.getElementById("reg-name").value;
      const email = document.getElementById("reg-email").value;
      const pass = document.getElementById("reg-password").value;
      const pass2 = document.getElementById("reg-password2").value;

      if (pass !== pass2) {
        alert("Las contraseñas no coinciden.");
        return;
      }

      const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nombre, email, password: pass })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error en el registro");
        return;
      }

      window.location.href = "/dashboard";
    });
  }

  // =============================
  // LOGIN
  // =============================
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("login-email").value;
      const pass = document.getElementById("login-password").value;

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password: pass })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Usuario o contraseña incorrecta");
        return;
      }

      window.location.href = "/dashboard";
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // ----- MENÚ HAMBURGUESA ----- 
  const toggleBtn = document.getElementById("navToggle");
  const overlay = document.querySelector(".nav-overlay");
  const sideMenu = document.querySelector(".nav__menu");

  if (toggleBtn && overlay && sideMenu) {
    toggleBtn.addEventListener("click", () => {
      overlay.classList.toggle("visible");
    });

    overlay.addEventListener("click", (e) => {
      if (!sideMenu.contains(e.target)) {
        overlay.classList.remove("visible");
      }
    });
  }
  })

/*--------------- MODALES -----------------*/
  document.addEventListener("DOMContentLoaded", () => {
  const radios = document.querySelectorAll('input[name="entrega"]');

  const formEnvio = document.getElementById("form-envio");
  const retiroInfo = document.getElementById("retiro-info");
  const costoEnvio = document.getElementById("costo-envio");

  radios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.value === "envio" && radio.checked) {
        formEnvio.classList.remove("oculto");
        retiroInfo.classList.add("oculto");
        costoEnvio.classList.remove("oculto");
      }

      if (radio.value === "retiro" && radio.checked) {
        retiroInfo.classList.remove("oculto");
        formEnvio.classList.add("oculto");
        costoEnvio.classList.add("oculto");
      }
    });
  });
});
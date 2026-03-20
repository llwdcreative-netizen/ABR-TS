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
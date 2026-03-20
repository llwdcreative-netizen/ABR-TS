document.addEventListener("DOMContentLoaded", () => {
//----------- MENÚ HAMBURGUESA -----------
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.querySelector(".barra__menu");

menuToggle.addEventListener("click", () => {
  navMenu.classList.toggle("active");
});


// ------------- CHAT FUNCIONAL
// ----- CHAT FLOTANTE -----
const chatBtn = document.getElementById("chat-btn");
const chatBox = document.getElementById("chat-box");
const closeChat = document.getElementById("close-chat");

if (chatBox) chatBox.classList.remove("active");

if (chatBtn && chatBox && closeChat) {
  chatBtn.addEventListener("click", () => {
    chatBox.classList.add("active");
  });

  closeChat.addEventListener("click", () => {
    chatBox.classList.remove("active");
  });
}

// --- CHAT ---
const chat = document.querySelector(".chat-content");

if (chat) {

  function addUserMessage(texto) {
    const msg = document.createElement("div");
    msg.classList.add("emisor");
    msg.textContent = texto;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
  }

  function botResponse(opcion) {
    let respuesta = "No entendí eso, ¿podrías repetirlo?";

    switch(opcion) {
      case "precios":
        respuesta = "Nuestros precios varían según el modelo. ¿Qué tipo de servicio necesitás?";
        break;

      case "servicios":
        respuesta = "Ofrecemos: cambio de pantalla, batería, repuestos, limpieza y diagnóstico gratuito.";
        break;

      case "contacto":
        respuesta = "Podés contactarnos por WhatsApp o Instagram. ¿Querés que te pase los links?";
        break;

      case "horarios":
        respuesta = "Atendemos de lunes a viernes de 9 a 18 hs, y sábados de 10 a 14 hs.";
        break;
    }

    const msgBot = document.createElement("div");
    msgBot.classList.add("receptor");
    msgBot.textContent = respuesta;
    chat.appendChild(msgBot);
    chat.scrollTop = chat.scrollHeight;
  }

  const opciones = document.querySelectorAll(".chat-btn-option");

  opciones.forEach(btn => {
    btn.addEventListener("click", () => {
      const opt = btn.dataset.opt;

      addUserMessage(btn.textContent);
      setTimeout(() => botResponse(opt), 400);
    });
  });

}
});

document.querySelectorAll(".faq-question").forEach(button => {
  button.addEventListener("click", () => {
    const currentAnswer = button.nextElementSibling;
    const isOpen = currentAnswer.style.maxHeight;

    // Cerrar todos
    document.querySelectorAll(".faq-answer").forEach(answer => {
      answer.style.maxHeight = null;
    });

    document.querySelectorAll(".faq-question").forEach(btn => {
      btn.classList.remove("active");
      btn.querySelector(".icon").textContent = "+";
    });

    // Si NO estaba abierto, lo abrimos
    if (!isOpen) {
      currentAnswer.style.maxHeight = currentAnswer.scrollHeight + "px";
      button.classList.add("active");
      button.querySelector(".icon").textContent = "−";
    }
  });
});
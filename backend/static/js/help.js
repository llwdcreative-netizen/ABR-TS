document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".contact-form");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      nombre: document.getElementById("nombre").value,
      apellido: document.getElementById("apellido").value,
      email: document.getElementById("email").value,
      telefono: document.getElementById("numero").value,
      mensaje: document.getElementById("mensaje").value
    };

    const res = await fetch("http://127.0.0.1:5000/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const info = await res.json();

    if (!res.ok) {
      alert("Error: " + info.error);
      return;
    }

    alert("Mensaje enviado correctamente 🎉");
    form.reset();
  });
});

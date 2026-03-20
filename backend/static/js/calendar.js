/*------------ CALENDARIO ---------------*/
const inputFecha = document.getElementById("fecha-turno");

inputFecha.addEventListener("input", () => {

  const fecha = new Date(inputFecha.value);
  const dia = fecha.getDay();

  if (dia === 0 || dia === 6) {
    alert("No se pueden seleccionar fines de semana");
    inputFecha.value = "";
  }

});

/*----------- HORARIO -------------*/
async function cargarHorarios(){

 const res = await fetch("/api/turnos/horarios");
 const horarios = await res.json();

 const cont = document.getElementById("horarios-container");

 cont.innerHTML = "";

 horarios.forEach(h => {

   const btn = document.createElement("button");

   btn.textContent = h;
   btn.classList.add("btn-horario");

   btn.onclick = () => seleccionarHorario(h, btn);

   cont.appendChild(btn);

 });

}
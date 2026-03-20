async function cargarTurnos(){

 const res = await fetch("/admin/api/turnos");
 const turnos = await res.json();

 const tabla = document.getElementById("tabla-turnos");

 tabla.innerHTML = "";

 turnos.forEach(t => {

   tabla.innerHTML += `
   <tr>
     <td>${t.fecha}</td>
     <td>${t.hora}</td>
     <td>${t.nombre}</td>
     <td>${t.dni || ""}</td>
     <td>${t.email || ""}</td>
     <td>${t.whatsapp || ""}</td>
     <td>${t.marca || ""}</td>
     <td>${t.modelo || ""}</td>
     <td>${t.tipo_reparacion || ""}</td>
     <td>${t.descripcion || ""}</td>
   </tr>
   `;

 });

}

document.addEventListener("DOMContentLoaded", cargarTurnos);


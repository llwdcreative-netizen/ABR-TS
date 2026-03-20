$(document).ready(function(){

const dispositivos = [];

for (const marca in modelos) {
  modelos[marca].forEach(modelo => {
    dispositivos.push({
      id: marca + " - " + modelo,
      text: marca + " - " + modelo
    });
  });
}

$('#dispositivo').select2({
  placeholder: "Toque aquí para buscar el modelo",
  data: dispositivos,
  width: "100%"
});

});

const modelos = { 
  Apple: [ 
    "iPhone 16 Pro Max","iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16","iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15", "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14", "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 Mini", "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 Mini", "iPhone SE (3ra generación)", "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11", "iPhone XR", "iPhone XS Max", "iPhone XS", "iPhone X", "iPhone SE (2da generación)", "iPhone 8 Plus", "iPhone 8", "iPhone 7 Plus", "iPhone 7", "iPhone SE (1ra generación)", "iPhone 6s Plus", "iPhone 6s", "iPhone 6 Plus", "iPhone 6", "iPhone 5s", "iPhone 5c", "iPhone 5", "iPhone 4s", "iPhone 4", "iPhone 3GS", "iPhone 3G", "iPhone", ], 
    
    Samsung: [ 
      "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23", "Galaxy S23 FE", "Galaxy S22 Ultra", "Galaxy S22+", "Galaxy S22", "Galaxy S21 Ultra", "Galaxy S21+", "Galaxy S21", "Galaxy S21 FE", "Galaxy S20 Ultra", "Galaxy S20+", "Galaxy S20", "Galaxy S20 FE", "Galaxy S10+", "Galaxy S10", "Galaxy S10e", "Galaxy S9+", "Galaxy S9", "Galaxy S8+", "Galaxy S8", "Galaxy S7 Edge", "Galaxy S7", "Galaxy S6 Edge+", "Galaxy S6 Edge", "Galaxy S6", "Galaxy S5", "Galaxy S4", "Galaxy S3", "Galaxy S2", "Galaxy S", "Galaxy Z Fold6", "Galaxy Z Fold5", "Galaxy Z Fold4", "Galaxy Z Fold3", "Galaxy Z Fold2", "Galaxy Fold", "Galaxy Z Flip6", "Galaxy Z Flip5", "Galaxy Z Flip4", "Galaxy Z Flip3", "Galaxy Z Flip", "Galaxy A55", "Galaxy A54", "Galaxy A53", "Galaxy A52", "Galaxy A52s", "Galaxy A51", "Galaxy A50", "Galaxy A34", "Galaxy A33", "Galaxy A32", "Galaxy A31", "Galaxy A30", "Galaxy A25", "Galaxy A24", "Galaxy A23", "Galaxy A22", "Galaxy A21", "Galaxy A20", "Galaxy A15", "Galaxy A14", "Galaxy A13", "Galaxy A12", "Galaxy A11", "Galaxy A10", ], 

  Xiaomi: [ 
    "Xiaomi 14 Ultra", "Xiaomi 14 Pro", "Xiaomi 14", "Xiaomi 13 Ultra", "Xiaomi 13 Pro", "Xiaomi 13", "Xiaomi 13 Lite", "Xiaomi 12T Pro", "Xiaomi 12T", "Xiaomi 12 Pro", "Xiaomi 12", "Xiaomi 12 Lite", "Xiaomi 11T Pro", "Xiaomi 11T", "Xiaomi 11 Ultra", "Xiaomi 11 Pro", "Xiaomi 11", "Xiaomi 11 Lite", "Mi 11", "Mi 10T Pro", "Mi 10T", "Mi 10 Pro", "Mi 10", "Mi 9T Pro", "Mi 9T", "Mi 9", "Mi 8", "Redmi Note 13 Pro+", "Redmi Note 13 Pro", "Redmi Note 13", "Redmi Note 12 Pro+", "Redmi Note 12 Pro", "Redmi Note 12", "Redmi Note 11 Pro+", "Redmi Note 11 Pro", "Redmi Note 11", "Redmi Note 10 Pro", "Redmi Note 10", "Redmi Note 9 Pro", "Redmi Note 9", "Redmi Note 8 Pro", "Redmi Note 8", "Redmi Note 7", "Redmi Note 6 Pro", "Redmi Note 5", "Redmi 13C", "Redmi 13", "Redmi 12C", "Redmi 12", "Redmi 11 Prime", "Redmi 10C", "Redmi 10", "Redmi 9C", "Redmi 9", "Redmi 8", "Redmi 7", "Redmi 6", "Redmi 5", "Poco F6 Pro", "Poco F6", "Poco F5 Pro", "Poco F5", "Poco F4 GT", "Poco F4", "Poco F3", "Poco F2 Pro", "Poco F1", "Poco X6 Pro", "Poco X6", "Poco X5 Pro", "Poco X5", "Poco X4 Pro", "Poco X3 Pro", "Poco X3 NFC", "Poco M6 Pro", "Poco M5", "Poco M4 Pro", "Poco M3", ], 

  Motorola: [ 
    "Motorola Edge 50 Ultra", "Motorola Edge 50 Pro", "Motorola Edge 50 Fusion", "Motorola Edge 40 Pro", "Motorola Edge 40", "Motorola Edge 40 Neo", "Motorola Edge 30 Ultra", "Motorola Edge 30 Pro", "Motorola Edge 30 Fusion", "Motorola Edge 30", "Motorola Edge 30 Neo", "Motorola Edge 20 Pro", "Motorola Edge 20", "Motorola Edge 20 Lite", "Motorola Edge+", "Motorola Edge", "Moto G84", "Moto G73", "Moto G72", "Moto G71", "Moto G62", "Moto G60", "Moto G60s", "Moto G54", "Moto G53", "Moto G52", "Moto G51", "Moto G50", "Moto G42", "Moto G41", "Moto G40 Fusion", "Moto G32", "Moto G31", "Moto G30", "Moto G22", "Moto G20", "Moto G14", "Moto G13", "Moto G10", "Moto G9 Plus", "Moto G9 Power", "Moto G9 Play", "Moto G8 Plus", "Moto G8 Power", "Moto G8", "Moto G7 Plus", "Moto G7 Power", "Moto G7", "Moto G6 Plus", "Moto G6", "Moto G6 Play", "Moto G5 Plus", "Moto G5", "Moto G4 Plus", "Moto G4", "Moto G3", "Moto G2", "Moto G", "Motorola Razr 50 Ultra", "Motorola Razr 50", "Motorola Razr 40 Ultra", "Motorola Razr 40", "Motorola Razr 2022", "Motorola Razr 5G", "Motorola Razr", ], 

    TCL: [ "TCL 50 Pro NXTPAPER", "TCL 50 NXTPAPER", "TCL 50 XL", "TCL 50 XE", "TCL 50 LE", "TCL 40 NXTPAPER", "TCL 40 XL", "TCL 40 XE", "TCL 40 SE", "TCL 40 X", "TCL 40 R", "TCL 40 LE", "TCL 30 XE 5G", "TCL 30 XL", "TCL 30 SE", "TCL 30", "TCL 20 Pro 5G", "TCL 20L+", "TCL 20L", "TCL 20 SE", "TCL 20 R 5G", "TCL 10 Pro", "TCL 10L", "TCL 10 SE", "TCL 10 Plus", "TCL Plex", "TCL 1", "TCL 10 Tab", ], 

    ZTE: [ "ZTE Axon 50 Ultra", "ZTE Axon 40 Ultra", "ZTE Axon 40 Pro", "ZTE Axon 30 Ultra", "ZTE Axon 30", "ZTE Axon 20 5G", "ZTE Axon 11", "ZTE Blade V50", "ZTE Blade V40", "ZTE Blade V40 Vita", "ZTE Blade V40 Smart", "ZTE Blade V40 Design", "ZTE Blade V30", "ZTE Blade V30 Vita", "ZTE Blade V30 Smart", "ZTE Blade A73", "ZTE Blade A72", "ZTE Blade A71", "ZTE Blade A53", "ZTE Blade A52", "ZTE Blade A51", "ZTE Blade A7", "ZTE Blade A5", "ZTE Blade A3", "ZTE Blade L9", "ZTE Blade L8", "ZTE Blade L7", "ZTE Blade L5", "ZTE Blade L3", ] 
  };

/*------------ ENVIAR FORMULARIO -----------*/
document.getElementById("enviar-turno").addEventListener("click", async () => {

  const data = {
    fecha: document.getElementById("fecha-turno").value,
    hora: document.querySelector(".horario-activo")?.dataset.hora || null,
    nombre: document.getElementById("nombre").value,
    dni: document.getElementById("dni").value,
    email: document.getElementById("email").value,
    whatsapp: document.getElementById("whatsapp").value,
    dispositivo: document.getElementById("dispositivo").value,
    tipo_reparacion: document.getElementById("tipo-reparacion").value,
    descripcion: document.getElementById("descripcion").value
  };

  if(!data.fecha || !data.hora){
    alert("Debe seleccionar fecha y horario");
    return;
  }

  const res = await fetch("/api/turnos",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify(data)
  });

  const result = await res.json();

  if(result.ok){
    alert("Turno solicitado correctamente");
    location.reload();
  }else{
    alert("Error al solicitar turno");
  }

});

/*------------ HORARIOS -------------*/
const hora = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00"
];

function cargarHorarios() {

  const container = document.getElementById("horarios-container");
  container.innerHTML = "";

  hora.forEach(hora => {

    const btn = document.createElement("button");
    btn.innerText = hora;
    btn.classList.add("horario-btn");
    btn.dataset.hora = hora;

    btn.addEventListener("click", () => {

      document
        .querySelectorAll(".horario-btn")
        .forEach(b => b.classList.remove("horario-activo"));

      btn.classList.add("horario-activo");

    });

    container.appendChild(btn);

  });

}

const botones = document.querySelectorAll("#horarios-container button");

botones.forEach(btn => {
  btn.addEventListener("click", () => {

    botones.forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

  });
});


document.addEventListener("DOMContentLoaded", cargarHorarios);
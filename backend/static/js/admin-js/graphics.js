fetch("/admin/api/estadisticas/pedidos")
  .then(res => res.json())
  .then(data => {
    const ctx = document.getElementById("pedidosChart");

    new Chart(ctx, {
      type: "doughnut", // o "bar"
      data: {
        labels: ["Completados", "Pendientes"],
        datasets: [{
          data: [data.completados, data.pendientes],
          backgroundColor: [
            "#22c55e", // verde
            "#f97316"  // naranja
          ]
        }]
      }
    });
  });

fetch("/admin/api/estadisticas/retiros")
  .then(res => res.json())
  .then(data => {
    const ctx = document.getElementById("retirosChart");

    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Retirados", "Pendientes"],
        datasets: [{
          data: [data.retirados, data.pendientes],
          backgroundColor: [
            "#22c55e", // verde
            "#eab308"  // amarillo
          ]
        }]
      }
    });
  });

fetch("/admin/api/estadisticas/tipos")
  .then(res => res.json())
  .then(data => {
    const ctx = document.getElementById("tiposChart");

    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Envíos", "Retiros"],
        datasets: [{
          data: [data.envios, data.retiros],
          backgroundColor: [
            "#3b82f6", // azul
            "#a855f7"  // violeta
          ]
        }]
      }
    });
  });

  fetch("/admin/api/estadisticas/total-dia")
  .then(res => res.json())
  .then(data => {
    const total = data.total_dia.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS"
    });

    document.getElementById("totalDia").textContent = total;
  });

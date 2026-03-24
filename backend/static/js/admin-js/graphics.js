fetch("/admin/api/dashboard")
  .then(res => res.json())
  .then(data => {

    // -------------------------
    // PEDIDOS
    // -------------------------
    new Chart(document.getElementById("pedidosChart"), {
      type: "doughnut",
      data: {
        labels: ["Completados", "Pendientes"],
        datasets: [{
          data: [
            data.pedidos.completados,
            data.pedidos.pendientes
          ],
          backgroundColor: ["#22c55e", "#f97316"]
        }]
      }
    });

    // -------------------------
    // RETIROS (detalle real)
    // -------------------------
    new Chart(document.getElementById("retirosChart"), {
      type: "doughnut",
      data: {
        labels: ["Pendientes", "Listos", "Retirados"],
        datasets: [{
          data: [
            data.retiros.pendientes,
            data.retiros.listos,
            data.retiros.retirados
          ],
          backgroundColor: ["#f97316", "#eab308", "#22c55e"]
        }]
      }
    });

    // -------------------------
    // TIPOS
    // -------------------------
    new Chart(document.getElementById("tiposChart"), {
      type: "doughnut",
      data: {
        labels: ["Envíos", "Retiros"],
        datasets: [{
          data: [
            data.tipos.envios,
            data.tipos.retiros
          ],
          backgroundColor: ["#3b82f6", "#a855f7"]
        }]
      }
    });

    // -------------------------
    // TOTAL DEL DÍA
    // -------------------------
    const total = data.total_dia.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS"
    });

    document.getElementById("totalDia").textContent = total;

  });
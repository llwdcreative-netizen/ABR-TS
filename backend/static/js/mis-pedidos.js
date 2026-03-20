async function cargarMisPedidos() {
  const res = await fetch("http://127.0.0.1:5000/envios/mis-pedidos", {
    credentials: "include"
  });

  const pedidos = await res.json();
  const cont = document.getElementById("lista-pedidos");
  cont.innerHTML = "";

  pedidos.forEach(p => {
    const div = document.createElement("div");
    div.className = "pedido-item";
    div.innerHTML = `
      <strong>Pedido #${p.id}</strong>
      <br>${p.fecha}<br>
      Estado: ${p.estado}<br>
      Total: $${p.total}
    `;

    div.onclick = () => {
      window.location.href =
        `/mipedido?id=${order.id}&tipo=${tipo}`;
    };

    cont.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", cargarMisPedidos);

document.addEventListener("DOMContentLoaded", async () => {

  async function checkLogin() {
    const res = await fetch("/me", { credentials: "include" });
    const data = await res.json();
    return data.logged === true;
  }

  const pathParts = window.location.pathname.split("/");
  const id = pathParts[pathParts.length - 1];

  if (!id || isNaN(id)) return;

  let shippingCost = 0;
  let producto;

  try {
    const resp = await fetch(`/api/productos/${id}`, {
      credentials: "include"
    });
    producto = await resp.json();
  } catch {
    return;
  }

  if (!producto || !producto.id) return;

  try {
    const shippingResp = await fetch("/api/shipping");
    const shippingData = await shippingResp.json();
    shippingCost = shippingData.shippingCost || 0;
  } catch {}

  const addBtn = document.getElementById("add-to-cart-detail");

  addBtn.classList.add("add-cart");
  addBtn.dataset.id = producto.id;
  addBtn.dataset.name = producto.nombre;
  addBtn.dataset.price = producto.precio;

  document.getElementById("prod-imagen").src =
    producto.imagen
      ? `/static/uploads/${producto.imagen}`
      : "/static/img/placeholder.png";

  document.getElementById("prod-nombre").textContent = producto.nombre;
  document.getElementById("prod-precio").textContent =
    `$${Number(producto.precio).toLocaleString("es-AR")}`;
  document.getElementById("fav-btn").dataset.id = producto.id;
  document.getElementById("prod-descripcion").textContent =
    producto.descripcion || "";


const buyNow = document.getElementById("buy-now");

if (!buyNow) return;

buyNow.addEventListener("click", async () => {

  const logged = await checkLogin();
  if (!logged) {
    alert("Tenés que iniciar sesión");
    window.location.href = "/login";
    return;
  }

  window.openModalCompra({
    nombre: producto.nombre,
    precio: producto.precio,
    envio: shippingCost,

    onConfirm: async (tipoEntrega) => {

      const carritoMP = [{
        name: producto.nombre,
        price: producto.precio,
        cantidad: 1
      }];

      const res = await fetch("/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tipo: tipoEntrega,
          productos: carritoMP
        })
      });

      const data = await res.json();
      if (!data.ok) throw new Error("Error");

      const referenciaId = data.pedido_id;

      await crearPagoMercadoPago(
        carritoMP,
        tipoEntrega,
        referenciaId,
        "test@test.com"
      );
    }
  });

});
});
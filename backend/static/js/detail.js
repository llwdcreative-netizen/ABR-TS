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

let bodyData = {
  tipo: tipoEntrega,
  origen: "producto",
  productos: carritoMP
};

  if (tipoEntrega === "envio") {
    const nombre = document.getElementById("env-nombre")?.value.trim();
    const telefono = document.getElementById("env-telefono")?.value.trim();
    const email = document.getElementById("env-email")?.value.trim();
    const calle = document.getElementById("env-calle")?.value.trim();
    const numero = document.getElementById("env-numero")?.value.trim();
    const ciudad = document.getElementById("env-ciudad")?.value.trim();
    const provincia = document.getElementById("env-provincia")?.value.trim();
    const cp = document.getElementById("env-cp")?.value.trim();

    if (!nombre || !telefono || !calle || !numero || !ciudad || !provincia || !cp) {
      return alert("Completá los datos de envío");
    }

    bodyData = {
      ...bodyData,
      nombre,
      telefono,
      email,
      calle,
      numero,
      ciudad,
      provincia,
      cp
  };
}

if (tipoEntrega === "retiro") {
  const nombre = document.getElementById("cliente")?.value.trim();

  bodyData = {
    ...bodyData,
    cliente: { nombre }
  };
}

const res = await fetch("/purchase", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify(bodyData)
});

      const data = await res.json();
      if (!data.ok) throw new Error("Error");

      const referenciaId = data.pedido_id;

    await crearPagoMercadoPago(
      carritoMP,
      "producto",
      referenciaId,
      "test@test.com"
    );
    }
  });

});
});
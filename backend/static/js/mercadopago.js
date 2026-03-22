function obtenerCarrito() {
  return JSON.parse(localStorage.getItem("carrito")) || [];
}

function calcularEnvio() { return 1500; } // ejemplo fijo

function calcularTotal() {
  const carrito = obtenerCarrito();
  const subtotal = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  return subtotal + calcularEnvio();
}

async function crearPagoMercadoPago(carrito, email) {
  const items = carrito.map(p => ({
    title: p.nombre,
    quantity: Number(p.cantidad) || 1,
    unit_price: Number(p.precio) || 0,
    currency_id: "ARS"
  }));

  const res = await fetch("/create_preference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ items, payer: { email }, auto_return: "approved" })
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "No se pudo crear la preferencia de pago");
  return data.preference_id;
}

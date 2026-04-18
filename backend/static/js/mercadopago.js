async function crearPagoMercadoPago(carrito, tipo, referencia_id, email) {
  const items = carrito.map(p => ({
    title: p.nombre,
    quantity: Number(p.cantidad) || 1,
    unit_price: Number(p.precio) || 0,
    currency_id: "ARS"
  }));


  console.log("ENVIANDO A MP:", {
  items,
  email,
  tipo,
  referencia_id
});

const res = await fetch("/create_preference", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    items,
    payer: { email },
    metadata: {              
      tipo,
      referencia_id
    },
    auto_return: "approved"
  })
});

  const data = await res.json();

  if (!data.ok) {
    console.error("ERROR MP:", data);
    throw new Error(data.error || "No se pudo crear la preferencia de pago");
  }

  console.log("MP DATA:", data);

  return data.id;
}
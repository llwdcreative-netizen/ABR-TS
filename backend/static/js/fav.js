document.querySelectorAll(".fav-btn").forEach(btn => {

  btn.addEventListener("click", async () => {

    const producto_id = btn.dataset.id;

    const res = await fetch("/api/favoritos/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ producto_id })
    });

    const data = await res.json();

    const icon = btn.querySelector("i");

    if(data.favorito){
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid");
    }else{
      icon.classList.remove("fa-solid");
      icon.classList.add("fa-regular");
    }

  });

});


/*----------------- CARGAR FAVORITOS ------------*/
async function cargarFavoritos(){

    const res = await fetch("/api/favoritos");
    const productos = await res.json();

    const grid = document.getElementById("favoritos-grid");

    if(!grid) return;

    grid.innerHTML = "";

    if(productos.length === 0){
        grid.innerHTML = "<p>No tienes productos favoritos aún.</p>";
        return;
    }

    productos.forEach(p => {

        const card = document.createElement("div");
        card.className = "producto-card";

        card.innerHTML = `
            <img src="/static/uploads/${p.imagen}" class="producto-img">

            <h3>${p.nombre}</h3>

            <p class="precio">$${p.precio}</p>

            <a href="/producto/${p.id}" class="btn-ver">
                Ver producto
            </a>
        `;

        grid.appendChild(card);

    });

}

cargarFavoritos();
async function cargarFavoritosPreview(){

    const grid = document.getElementById("favoritos-preview-grid");

    if(!grid) return;

    const res = await fetch("/api/favoritos/preview");
    const productos = await res.json();

    grid.innerHTML = "";

    productos.forEach(p => {

        const card = document.createElement("div");
        card.className = "producto-card";

        card.innerHTML = `
            <a href="/producto/${p.id}">
                <img src="/static/uploads/${p.imagen}">
                <h4>${p.nombre}</h4>
                <p>$${p.precio}</p>
            </a>
        `;

        grid.appendChild(card);

    });

}

cargarFavoritosPreview();
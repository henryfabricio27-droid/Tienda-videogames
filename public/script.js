// ELEMENTOS
const grid = document.querySelector("#grid-videojuegos");
const estadoCarga = document.querySelector("#estado-carga");
const estadoError = document.querySelector("#estado-error");

const inputBusqueda = document.querySelector("#input-busqueda");
const btnBuscar = document.querySelector("#btn-buscar");
const filtroPlataforma = document.querySelector("#filtro-plataforma");
const ordenSelect = document.querySelector("#orden");

// TÍTULO Y SUBTÍTULO DINÁMICO
const tituloDinamico = document.querySelector("#titulo-dinamico");
const subtituloDinamico = document.querySelector("#subtitulo-dinamico");

// MODAL ELEMENTOS
const modal = document.querySelector("#modal-detalle");
const modalImagen = document.querySelector("#modal-imagen");
const modalTitulo = document.querySelector("#modal-titulo");
const modalPrecio = document.querySelector("#modal-precio");
const modalRating = document.querySelector("#modal-rating");
const modalLink = document.querySelector("#modal-link");

let juegosCargados = [];
let mensajeNoResultados = "";

// CARGA INICIAL
async function cargarVideojuegos() {
  try {
    estadoCarga.classList.remove("hidden");

    const resp = await fetch(
      "https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=15"
    );

    juegosCargados = await resp.json();

    estadoCarga.classList.add("hidden");

    actualizarTitulos(juegosCargados, "", "", "");
    renderizarVideojuegos(juegosCargados);

  } catch (error) {
    estadoCarga.classList.add("hidden");
    estadoError.classList.remove("hidden");
  }
}

// ACTUALIZAR TÍTULO + SUBTÍTULO
function actualizarTitulos(lista, buscar, plataforma, orden) {
  if (buscar) {
    tituloDinamico.textContent = `Resultados para: "${buscar}"`;
  } else {
    tituloDinamico.textContent = "Videojuegos en oferta";
  }

  let texto = [];

  if (plataforma) texto.push(`Plataforma: ${plataforma.toUpperCase()}`);
  if (orden === "name") texto.push("Ordenado por nombre");
  if (orden === "rating") texto.push("Ordenado por mejor rating");
  if (orden === "recent") texto.push("Más recientes primero");

  texto.push(`Mostrando ${lista.length} juegos`);

  subtituloDinamico.textContent = texto.join(" • ");
}

// RENDER GRID
function renderizarVideojuegos(lista) {
  grid.innerHTML = "";

  if (lista.length === 0) {
    grid.innerHTML = `
      <p class="col-span-full text-center text-red-600 font-semibold">
        ${mensajeNoResultados}
      </p>
    `;
    return;
  }

  lista.forEach(juego => {
    const card = document.createElement("article");

    card.className =
      "bg-white shadow rounded-lg overflow-hidden border border-slate-200 flex flex-col";

    card.innerHTML = `
      <img src="${juego.thumb}" class="h-32 w-full object-cover" />
      <div class="p-3 flex flex-col gap-1 flex-1">
        <h3 class="font-semibold text-slate-900">${juego.title}</h3>

        <p class="text-sm text-slate-500">
          <s>$${juego.normalPrice}</s> → 
          <span class="font-bold text-slate-900">$${juego.salePrice}</span>
        </p>

        <button data-id="${juego.dealID}"
          class="btn-detalle bg-slate-900 text-white py-1 mt-2 rounded-lg text-sm hover:bg-slate-800">
          Ver detalle
        </button>
      </div>
    `;

    grid.appendChild(card);
  });

  document.querySelectorAll(".btn-detalle").forEach(btn => {
    btn.addEventListener("click", () => mostrarDetalle(btn.dataset.id));
  });
}

// MOSTRAR DETALLE
async function mostrarDetalle(id) {
  try {
    const resp = await fetch(
      `https://www.cheapshark.com/api/1.0/deals?id=${id}`
    );

    const data = await resp.json();
    const info = data.gameInfo;

    modalImagen.src = info.thumb;
    modalTitulo.textContent = info.name;

    modalPrecio.innerHTML = `
      Precio normal: <s>$${info.retailPrice}</s><br>
      Oferta: <b>$${info.salePrice}</b>
    `;

    modalRating.textContent =
      info.steamRatingText
        ? `Rating Steam: ${info.steamRatingText} (${info.steamRatingPercent}%)`
        : "Sin rating disponible";

    modalLink.href = info.dealURL;

    modal.classList.remove("hidden");

  } catch (error) {
    alert("Error al obtener detalles del videojuego");
  }
}

// CERRAR MODAL
document.querySelector("#cerrar-modal").addEventListener("click", () => {
  modal.classList.add("hidden");
});

// FILTROS
btnBuscar.addEventListener("click", filtrar);
inputBusqueda.addEventListener("keypress", (e) => {
  if (e.key === "Enter") filtrar();
});
filtroPlataforma.addEventListener("change", filtrar);
ordenSelect.addEventListener("change", filtrar);

// FUNCIÓN DE FILTRADO
function filtrar() {
  let resultado = [...juegosCargados];

  const buscar = inputBusqueda.value.toLowerCase();
  const plataforma = filtroPlataforma.value;
  const orden = ordenSelect.value;

  mensajeNoResultados = "";

  // BUSCAR POR NOMBRE
  if (buscar) {
    resultado = resultado.filter(j =>
      j.title.toLowerCase().includes(buscar)
    );

    if (resultado.length === 0) {
      mensajeNoResultados = "No existe ningún juego con ese nombre.";
      actualizarTitulos([], buscar, plataforma, orden);
      return renderizarVideojuegos([]);
    }
  }

  // FILTRO POR PLATAFORMA
  if (plataforma) {
    resultado = resultado.filter(j => j.steamAppID !== null);

    if (resultado.length === 0) {
      mensajeNoResultados = "No existe ningún juego para esta plataforma.";
      actualizarTitulos([], buscar, plataforma, orden);
      return renderizarVideojuegos([]);
    }
  }

  // ORDENAR
  if (orden === "name") {
    resultado.sort((a, b) => a.title.localeCompare(b.title));
  }

  if (orden === "rating") {
    resultado.sort((a, b) => (b.steamRatingPercent || 0) - (a.steamRatingPercent || 0));
  }

  if (orden === "recent") {
    resultado.sort((a, b) => Number(b.lastChange) - Number(a.lastChange));
  }

  actualizarTitulos(resultado, buscar, plataforma, orden);
  renderizarVideojuegos(resultado);
}

// INICIO
cargarVideojuegos();


let mapa;
let marcadores = [];
let aristas = [];

// Inicializa el mapa
function initMap() {
  mapa = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: { lat: -16.52, lng: -68.15 }
  });

  // Permitir agregar nodos con clic
  mapa.addListener("click", (e) => {
    const nombreNodo = prompt("Nombre del nodo:");
    if (!nombreNodo) return;

    const marcador = new google.maps.Marker({
      position: e.latLng,
      map: mapa,
      label: nombreNodo
    });

    marcadores.push({
      nombre: nombreNodo,
      pos: e.latLng
    });
  });
}

// Registrar listener del formulario
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("form-arista").addEventListener("submit", (e) => {
    e.preventDefault();
    agregarArista();
  });
});

// Agregar una arista a la lista
function agregarArista() {
  const A = document.getElementById("nodoA").value;
  const B = document.getElementById("nodoB").value;
  const tiempo = parseFloat(document.getElementById("tiempo").value);

  if (!A || !B || isNaN(tiempo)) {
    alert("Complete todos los campos correctamente.");
    return;
  }

  aristas.push({ A, B, tiempo });
  actualizarLista();
}

// Mostrar aristas
function actualizarLista() {
  const lista = document.getElementById("listaAristas");
  lista.innerHTML = "";

  aristas.forEach(a => {
    const li = document.createElement("li");
    li.textContent = `${a.A} → ${a.B} (tiempo: ${a.tiempo} min)`;
    lista.appendChild(li);
  });
}

// PROGRAMACIÓN DINÁMICA EN EL DAG
function calcularRuta() {
  const inicio = document.getElementById("nodoInicio").value;
  const fin = document.getElementById("nodoFin").value;

  if (!inicio || !fin) {
    alert("Ingrese nodo inicio y destino.");
    return;
  }

  // Extraer todos los nodos únicos
  const nodos = [...new Set(aristas.flatMap(a => [a.A, a.B]))];

  // Inicializar la DP
  const dp = {};
  nodos.forEach(n => dp[n] = Infinity);
  dp[fin] = 0;

  // Orden topológico simple (por ahora se asume correcto)
  const orden = nodos;

  // DP de atrás hacia adelante
  for (let i = orden.length - 1; i >= 0; i--) {
    const nodo = orden[i];

    aristas
      .filter(a => a.A === nodo)
      .forEach(a => {
        dp[nodo] = Math.min(dp[nodo], a.tiempo + dp[a.B]);
      });
  }

  // Reconstruir ruta óptima
  let ruta = [inicio];
  let actual = inicio;

  while (actual !== fin) {
    let mejor = null;
    let mejorTiempo = Infinity;

    aristas
      .filter(a => a.A === actual)
      .forEach(a => {
        const candidato = a.tiempo + dp[a.B];
        if (candidato < mejorTiempo) {
          mejorTiempo = candidato;
          mejor = a;
        }
      });

    if (!mejor) break; // No hay ruta

    ruta.push(mejor.B);
    actual = mejor.B;
  }

  // Mostrar resultados
  document.getElementById("resultado").textContent =
    `Tiempo óptimo total: ${dp[inicio]} minutos`;

  document.getElementById("rutaOptima").textContent =
    `Ruta óptima: ${ruta.join(" → ")}`;

  dibujarRutaEnMapa(ruta);
}

// DIBUJAR RUTA EN EL MAPA
let polyline = null; // <- NUEVO, guarda la ruta actual

function dibujarRutaEnMapa(ruta) {
  if (ruta.length < 2) return;

  let puntos = [];

  ruta.forEach(nombreNodo => {
    const nodo = marcadores.find(m => m.nombre === nombreNodo);
    if (nodo) puntos.push(nodo.pos);
  });

  // ELIMINA LA RUTA ANTERIOR SI EXISTE
  if (polyline) {
    polyline.setMap(null);
  }

  // DIBUJA LA NUEVA RUTA
  polyline = new google.maps.Polyline({
    path: puntos,
    map: mapa,
    strokeColor: "#1E90FF",
    strokeWeight: 5
  });
}

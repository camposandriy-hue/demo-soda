"use strict";

/* ==========================================================
   Soda La Casita del Sabor — demo de ACODE Solutions CR
   Menú filtrable, pedido por WhatsApp y estado abierto/cerrado
   ========================================================== */

/* ---------- CONFIGURACIÓN (lo único que cambias por cliente) ---------- */
const CONFIG = {
  negocio: "Soda La Casita del Sabor",
  // Número con código de país y sin espacios ni guiones. Ejemplo: 50688881234
  whatsapp: "70565110",
  // Enlace del mapa: reemplaza por la ubicación real del negocio
  mapa: "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent("Soda La Casita del Sabor Costa Rica"),
};

/* Horario por día de la semana (0 = domingo). [apertura, cierre] en horas de 24 h; null = cerrado */
const HORARIO = {
  0: null,
  1: [6, 16],
  2: [6, 16],
  3: [6, 16],
  4: [6, 16],
  5: [6, 16],
  6: [6, 14],
};

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/* ---------- MENÚ (editable por el dueño) ---------- */
const MENU = [
  // Platillo del día: aparece en su tarjeta destacada y no en la lista (oculto: true)
  { id: "olla-carne", categoria: "Almuerzos", nombre: "Olla de carne", descripcion: "Con yuca, ñampí, chayote, plátano y arroz.", precio: 4000, oculto: true },

  { id: "gallo-pinto", categoria: "Desayunos", nombre: "Gallo pinto con huevo", descripcion: "Con huevo al gusto, natilla y tortilla.", precio: 2500 },
  { id: "pinto-natilla", categoria: "Desayunos", nombre: "Pinto con natilla y plátano", descripcion: "Gallo pinto, natilla y plátano maduro frito.", precio: 3200, etiqueta: "Favorito" },
  { id: "tortilla-queso", categoria: "Desayunos", nombre: "Tortilla de queso con café", descripcion: "Tortilla de maíz con queso derretido y café.", precio: 2000, etiqueta: "Vegetariano" },

  { id: "casado-pollo", categoria: "Almuerzos", nombre: "Casado con pollo", descripcion: "Arroz, frijoles, ensalada, plátano y pollo a la plancha.", precio: 3800, etiqueta: "Más pedido" },
  { id: "casado-carne", categoria: "Almuerzos", nombre: "Casado con carne en salsa", descripcion: "Arroz, frijoles, ensalada, plátano y carne en salsa.", precio: 4200 },
  { id: "casado-pescado", categoria: "Almuerzos", nombre: "Casado con pescado", descripcion: "Arroz, frijoles, ensalada, plátano y filete de pescado.", precio: 4500 },
  { id: "arroz-pollo", categoria: "Almuerzos", nombre: "Arroz con pollo", descripcion: "Arroz con vegetales y pollo, con ensalada.", precio: 3500 },

  { id: "cafe", categoria: "Bebidas", nombre: "Café chorreado", descripcion: "Café de la zona, recién hecho.", precio: 1000 },
  { id: "fresco", categoria: "Bebidas", nombre: "Fresco natural", descripcion: "Fruta del día: mora, cas o piña.", precio: 1200 },
  { id: "agua-dulce", categoria: "Bebidas", nombre: "Agua dulce con limón", descripcion: "Fría o caliente, a su gusto.", precio: 900 },

  { id: "arroz-leche", categoria: "Postres", nombre: "Arroz con leche", descripcion: "Con canela, hecho en casa.", precio: 1500 },
  { id: "tres-leches", categoria: "Postres", nombre: "Tres leches", descripcion: "Porción grande, suave y bien húmeda.", precio: 2200 },
];

/* ---------- ESTADO DEL PEDIDO ---------- */
const pedido = new Map(); // id -> cantidad

/* ---------- UTILIDADES ---------- */
function colones(n) {
  return "₡" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function urlWhatsApp(texto) {
  return "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(texto);
}

function porId(id) {
  return MENU.find((p) => p.id === id);
}

function el(id) {
  return document.getElementById(id);
}

/* ---------- ENLACES DE WHATSAPP Y MAPA ---------- */
function configurarEnlaces() {
  const consulta = urlWhatsApp("Hola, quiero hacer una consulta sobre " + CONFIG.negocio);
  ["btnWhatsHero", "btnWhatsContacto", "waFloat"].forEach((id) => {
    const enlace = el(id);
    if (enlace) enlace.href = consulta;
  });
  const mapa = el("btnMapa");
  if (mapa) mapa.href = CONFIG.mapa;
}

/* ---------- ESTADO ABIERTO / CERRADO (hora de Costa Rica) ---------- */
function ahoraCR() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica" }));
}

function formatoHora(h) {
  const sufijo = h < 12 ? "a. m." : "p. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + ":00 " + sufijo;
}

function actualizarEstado() {
  const etiqueta = el("estado");
  if (!etiqueta) return;

  const ahora = ahoraCR();
  const dia = ahora.getDay();
  const hora = ahora.getHours() + ahora.getMinutes() / 60;
  const hoy = HORARIO[dia];

  if (hoy && hora >= hoy[0] && hora < hoy[1]) {
    etiqueta.textContent = "Abierto ahora · cerramos a las " + formatoHora(hoy[1]);
    etiqueta.className = "status open";
    return;
  }

  for (let i = 0; i <= 7; i++) {
    const d = (dia + i) % 7;
    const horario = HORARIO[d];
    if (!horario) continue;
    if (i === 0 && hora >= horario[0]) continue; // hoy ya pasó la hora de apertura
    const cuando = i === 0 ? "hoy" : i === 1 ? "mañana" : "el " + DIAS[d];
    etiqueta.textContent = "Cerrado ahora · abrimos " + cuando + " a las " + formatoHora(horario[0]);
    etiqueta.className = "status closed";
    return;
  }
}

/* ---------- MENÚ: FILTROS Y TARJETAS ---------- */
function categorias() {
  const lista = [];
  MENU.forEach((p) => {
    if (!p.oculto && !lista.includes(p.categoria)) lista.push(p.categoria);
  });
  return ["Todo"].concat(lista);
}

function renderFiltros(activa) {
  const cont = el("filtros");
  cont.innerHTML = "";
  categorias().forEach((cat) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "chip";
    boton.textContent = cat;
    boton.setAttribute("aria-pressed", String(cat === activa));
    boton.addEventListener("click", () => {
      renderFiltros(cat);
      renderMenu(cat);
    });
    cont.appendChild(boton);
  });
}

function accionesHTML(id) {
  const cantidad = pedido.get(id) || 0;
  if (cantidad === 0) {
    return '<button class="add-btn" type="button" data-add="' + id + '">Agregar al pedido</button>';
  }
  return (
    '<div class="qty">' +
      '<button type="button" data-dec="' + id + '" aria-label="Quitar uno">−</button>' +
      "<span>" + cantidad + "</span>" +
      '<button type="button" data-inc="' + id + '" aria-label="Agregar uno">+</button>' +
    "</div>"
  );
}

function renderMenu(categoria) {
  const grid = el("menuGrid");
  grid.innerHTML = "";

  MENU.filter((p) => !p.oculto && (categoria === "Todo" || p.categoria === categoria)).forEach((p) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "dish";
    tarjeta.innerHTML =
      (p.etiqueta ? '<span class="dish-tag">' + p.etiqueta + "</span>" : "") +
      '<div class="dish-top"><h3>' + p.nombre + '</h3><span class="dish-price">' + colones(p.precio) + "</span></div>" +
      "<p>" + p.descripcion + "</p>" +
      '<div class="dish-actions" data-actions="' + p.id + '">' + accionesHTML(p.id) + "</div>";
    grid.appendChild(tarjeta);
  });
}

function actualizarAcciones(id) {
  const cont = document.querySelector('[data-actions="' + id + '"]');
  if (cont) cont.innerHTML = accionesHTML(id);
}

/* ---------- PEDIDO ---------- */
function cambiarCantidad(id, delta) {
  const nueva = (pedido.get(id) || 0) + delta;
  if (nueva <= 0) pedido.delete(id);
  else pedido.set(id, nueva);
  actualizarAcciones(id);
  actualizarBarra();
}

function mensajePedido() {
  let total = 0;
  const lineas = [];
  pedido.forEach((cantidad, id) => {
    const p = porId(id);
    const subtotal = p.precio * cantidad;
    total += subtotal;
    lineas.push("- " + cantidad + " x " + p.nombre + " (" + colones(subtotal) + ")");
  });
  return (
    "Hola, quiero hacer un pedido en " + CONFIG.negocio + ":\n" +
    lineas.join("\n") + "\n" +
    "Total: " + colones(total) + "\n\n" +
    "Nombre: \n" +
    "Hora de recogida: "
  );
}

function actualizarBarra() {
  let cantidadTotal = 0;
  let total = 0;
  pedido.forEach((cantidad, id) => {
    cantidadTotal += cantidad;
    total += porId(id).precio * cantidad;
  });

  const barra = el("orderBar");
  barra.hidden = cantidadTotal === 0;
  document.body.classList.toggle("has-order", cantidadTotal > 0);

  el("orderCount").textContent = cantidadTotal + (cantidadTotal === 1 ? " platillo" : " platillos");
  el("orderTotal").textContent = colones(total);
  el("orderSend").href = cantidadTotal > 0 ? urlWhatsApp(mensajePedido()) : "#";
}

function vaciarPedido() {
  const ids = Array.from(pedido.keys());
  pedido.clear();
  ids.forEach(actualizarAcciones);
  actualizarBarra();
}

/* ---------- INICIO ---------- */
document.addEventListener("click", (evento) => {
  const objetivo = evento.target.closest("[data-add], [data-inc], [data-dec]");
  if (!objetivo) return;
  if (objetivo.dataset.add) cambiarCantidad(objetivo.dataset.add, 1);
  else if (objetivo.dataset.inc) cambiarCantidad(objetivo.dataset.inc, 1);
  else if (objetivo.dataset.dec) cambiarCantidad(objetivo.dataset.dec, -1);
});

el("orderClear").addEventListener("click", vaciarPedido);

configurarEnlaces();
renderFiltros("Todo");
renderMenu("Todo");
actualizarEstado();
setInterval(actualizarEstado, 60000);
el("anio").textContent = new Date().getFullYear();

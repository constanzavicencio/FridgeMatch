const ingredientImageMap: Record<string, string> = {
  aceite: "/ingredientes/aceite.png",
  ajo: "/ingredientes/ajo.png",
  arroz: "/ingredientes/arroz.png",
  brcoli: "/ingredientes/brocoli.png",
  brocoli: "/ingredientes/brocoli.png",
  carne: "/ingredientes/carne.png",
  cebolla: "/ingredientes/cebolla.png",
  champinon: "/ingredientes/champinon.png",
  choclo: "/ingredientes/choclo.png",
  frutilla: "/ingredientes/frutilla.png",
  harina: "/ingredientes/harina.png",
  huevo: "/ingredientes/huevo.png",
  leche: "/ingredientes/leche.png",
  lechuga: "/ingredientes/lechuga.png",
  limon: "/ingredientes/limon.png",
  mantequilla: "/ingredientes/mantequilla.png",
  manzana: "/ingredientes/manzana.png",
  palta: "/ingredientes/palta.png",
  papa: "/ingredientes/papa.png",
  pepino: "/ingredientes/pepino.png",
  pimienta: "/ingredientes/pimienta.png",
  platano: "/ingredientes/platano.png",
  pollo: "/ingredientes/pollo.png",
  queso: "/ingredientes/queso.png",
  sal: "/ingredientes/sal.png",
  spaghetti: "/ingredientes/spaghetti.png",
  tomate: "/ingredientes/tomate.png",
  zanahoria: "/ingredientes/zanahoria.png",
};

function normalizeIngredientName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

export function getIngredientImageSrc(name: string) {
  const normalizedName = normalizeIngredientName(name);

  if (ingredientImageMap[normalizedName]) {
    return ingredientImageMap[normalizedName];
  }

  const singularName = normalizedName.endsWith("s") ? normalizedName.slice(0, -1) : normalizedName;
  if (ingredientImageMap[singularName]) {
    return ingredientImageMap[singularName];
  }

  if (normalizedName.includes("brocoli")) return "/ingredientes/brocoli.png";
  if (normalizedName.includes("zanahoria")) return "/ingredientes/zanahoria.png";
  if (normalizedName.includes("tomate")) return "/ingredientes/tomate.png";
  if (normalizedName.includes("cebolla")) return "/ingredientes/cebolla.png";
  if (normalizedName.includes("queso")) return "/ingredientes/queso.png";
  if (normalizedName.includes("huevo")) return "/ingredientes/huevo.png";
  if (normalizedName.includes("papa")) return "/ingredientes/papa.png";
  if (normalizedName.includes("aceite")) return "/ingredientes/aceite.png";
  if (normalizedName.includes("pimienta")) return "/ingredientes/pimienta.png";
  if (normalizedName.includes("sal")) return "/ingredientes/sal.png";
  if (normalizedName.includes("ajo")) return "/ingredientes/ajo.png";
  if (normalizedName.includes("pepino")) return "/ingredientes/pepino.png";
  if (normalizedName.includes("lechuga")) return "/ingredientes/lechuga.png";
  if (normalizedName.includes("mantequilla")) return "/ingredientes/mantequilla.png";

  return null;
}

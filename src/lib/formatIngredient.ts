/**
 * Formatea un ingrediente según su cantidad y unidad.
 * - Si unidad es "unidad": pluraliza el nombre (ej: "1 cebolla", "3 tomates")
 * - Si otro caso: muestra "cantidad unidad de nombre" (ej: "2 tazas de harina")
 * - Siempre en minúscula
 */
export function formatIngredient(
  quantity: number,
  unit: string,
  ingredientName: string
): string {
  const nameLowercase = ingredientName.toLowerCase();

  // Caso especial: "unidad" - solo mostrar cantidad y nombre (con pluralización si necesario)
  if (unit === "unidad") {
    if (quantity === 1) {
      return `1 ${nameLowercase}`;
    }

    if (quantity === 0.5) {
      return `½ ${nameLowercase}`;
    }

    // Pluralizar: reglas simples para español
    const plural = pluralizeSpanish(nameLowercase);
    return `${formatQuantity(quantity)} ${plural}`;
  }

  // Caso general: mostrar cantidad, unidad y nombre
  return `${formatQuantity(quantity)} ${unit} de ${nameLowercase}`;
}

function formatQuantity(quantity: number): string {
  const whole = Math.trunc(quantity);
  const decimal = Math.abs(quantity - whole);

  if (Math.abs(decimal - 0.5) < Number.EPSILON) {
    return whole === 0 ? "½" : `${whole} ½`;
  }

  return `${quantity}`;
}

/**
 * Pluraliza un sustantivo en español (reglas simples).
 * Ejemplos: "tomate" → "tomates", "cebolla" → "cebollas"
 */
function pluralizeSpanish(word: string): string {
  // Si termina en vocal (a, e, o) o en "l", "r", "n", "s", "z": agregar "s"
  // Si termina en "z": cambiar "z" por "ces" (en casos específicos)
  // Para simplificar, aplicamos la regla general: agregar "s" al final

  if (word.endsWith("z")) {
    // "pez" → "peces", pero "arroz" → "arroces"
    // Regla simple: cambiar "z" por "ces"
    return word.slice(0, -1) + "ces";
  }

  return word + "s";
}

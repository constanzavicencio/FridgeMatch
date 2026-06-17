export function normalizeIngredientName(name: string): string {
  return singularizeIngredient(
    removeAccents(decodeURIComponent(name).trim().toLowerCase())
  );
}

function removeAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function singularizeIngredient(value: string): string {
  const irregulars: Record<string, string> = {
    huevos: "huevo",
  };

  if (irregulars[value]) {
    return irregulars[value];
  }

  return value
    .split(" ")
    .map(singularizeWord)
    .join(" ");
}

function singularizeWord(word: string): string {
  if (word.endsWith("ces")) {
    return word.slice(0, -3) + "z";
  }

  if (word.endsWith("es")) {
    return word.slice(0, -2);
  }

  if (word.endsWith("s")) {
    return word.slice(0, -1);
  }

  return word;
}
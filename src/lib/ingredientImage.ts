function normalizeIngredientName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

export function getIngredientImageSrc(name: string) {
  const normalizedName = normalizeIngredientName(name);

  if (!normalizedName) {
    return null;
  }

  console.log(`/api/ingredients/${encodeURIComponent(name)}`)
  return `/api/ingredients/${encodeURIComponent(name)}`;
}

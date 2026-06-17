import { createSupabaseAdminClient } from "./admin";

export const INGREDIENTS_BUCKET =
  process.env.SUPABASE_INGREDIENTS_BUCKET || "ingredients";

const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60;

/**
 * Normaliza nombre de ingrediente a slug para búsqueda en storage.
 * "Arroz Blanco" → "arroz-blanco"
 */
function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Obtiene signed URL para una imagen almacenada en Supabase Storage.
 * Intenta acceder a la ruta y registra el resultado.
 * @param imagePath - Ruta en storage (ej: "catalog/ajo.png")
 * @returns Signed URL temporal (1 hora) o null si no existe/falla
 */
export async function getIngredientSignedImageUrl(imagePath: string | null) {
  if (!imagePath) {
    console.log("[ingredient-images] ✗ No imagePath provided");
    return null;
  }

  console.log(`[ingredient-images] Buscando signed URL: ${INGREDIENTS_BUCKET}/${imagePath}`);

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.storage
    .from(INGREDIENTS_BUCKET)
    .createSignedUrl(imagePath, SIGNED_URL_EXPIRES_IN_SECONDS);

  if (error) {
    console.log(`[ingredient-images] ✗ Error generando signed URL: ${error.message}`);
    return null;
  }

  if (!data?.signedUrl) {
    console.log(`[ingredient-images] ✗ No signed URL en respuesta para: ${imagePath}`);
    return null;
  }

  console.log(`[ingredient-images] ✓ Signed URL obtenida: ${imagePath}`);
  return data.signedUrl;
}

/**
 * Busca una imagen en Supabase Storage usando el nombre del ingrediente.
 * Prueba rutas estándar: "catalog/{slug}.png"
 * @param ingredientName - Nombre del ingrediente (será slugificado)
 * @returns { imagePath, imageUrl } si existe, null si no
 */
export async function findIngredientImageInStorage(ingredientName: string) {
  const slug = slugify(ingredientName);

  if (!slug) {
    console.log(`[ingredient-images] ✗ No se pudo slugificar: "${ingredientName}"`);
    return null;
  }

  console.log(`[ingredient-images] Buscando en storage: "${ingredientName}" → slug "${slug}"`);

  const candidatePath = `catalog/${slug}.png`;

  console.log(`[ingredient-images] Intentando acceder: ${INGREDIENTS_BUCKET}/${candidatePath}`);

  const signedUrl = await getIngredientSignedImageUrl(candidatePath);

  if (signedUrl) {
    console.log(`[ingredient-images] ✓ Imagen encontrada en storage`);
    return { imagePath: candidatePath, imageUrl: signedUrl };
  }

  console.log(`[ingredient-images] ✗ Imagen NO encontrada en storage`);
  return null;
}

function getExtension(file: File) {
  const type = file.type;

  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";

  return "png";
}

export async function uploadIngredientImage({
  ingredientName,
  file,
}: {
  ingredientName: string;
  file: File;
}) {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen");
  }

  const supabase = createSupabaseAdminClient();

  const extension = getExtension(file);
  const path = `catalog/${slugify(ingredientName)}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from(INGREDIENTS_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "image/png",
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}
import { createSupabaseAdminClient } from "./admin";

export const RECIPES_IMAGE_FOLDER = "recetas";
export const RECIPES_BUCKET = process.env.SUPABASE_INGREDIENTS_BUCKET || "ingredients";
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60;
const CANDIDATE_EXTENSIONS = ["jpg", "jpeg", "png"] as const;

/**
 * Normaliza el título de una receta al slug de imagen.
 * "Ensalada Fresca" → "ensalada_fresca"
 */
export function slugifyRecipeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Obtiene URLs firmadas para imágenes de recetas en batch (una sola llamada a storage).
 * Prueba extensiones jpg, jpeg y png para cada título.
 * @returns Map<title, signedUrl>
 */
export async function getRecipeImageUrlsMap(
  titles: string[]
): Promise<Map<string, string>> {
  if (titles.length === 0) return new Map();

  const supabase = createSupabaseAdminClient();

  // Genera todos los candidatos: para cada título, 3 extensiones
  const candidates = titles.flatMap((title) => {
    const slug = slugifyRecipeTitle(title);
    return CANDIDATE_EXTENSIONS.map((ext) => ({
      path: `${RECIPES_IMAGE_FOLDER}/${slug}.${ext}`,
      title,
    }));
  });

  const { data, error } = await supabase.storage
    .from(RECIPES_BUCKET)
    .createSignedUrls(
      candidates.map((c) => c.path),
      SIGNED_URL_EXPIRES_IN_SECONDS
    );

  if (error || !data) return new Map();

  const result = new Map<string, string>();

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const { title } = candidates[i];
    // El primer candidato válido por título gana
    if (item.signedUrl && !result.has(title)) {
      result.set(title, item.signedUrl);
    }
  }

  return result;
}

/**
 * Sube una imagen de receta al bucket de Supabase Storage.
 * El nombre del archivo se deriva automáticamente del título.
 * @returns La ruta en storage donde quedó guardada la imagen
 */
export async function uploadRecipeImage({
  title,
  file,
}: {
  title: string;
  file: File;
}): Promise<{ path: string } | null> {
  const slug = slugifyRecipeTitle(title);

  if (!slug) return null;

  const ext = getExtension(file);
  const path = `${RECIPES_IMAGE_FOLDER}/${slug}.${ext}`;

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.storage
    .from(RECIPES_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    console.error(`[recipe-images] Error al subir imagen: ${error.message}`);
    return null;
  }

  return { path };
}

function getExtension(file: File): string {
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpg";
  return "jpg";
}

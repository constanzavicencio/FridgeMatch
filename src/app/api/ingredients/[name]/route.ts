import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getIngredientSignedImageUrl,
  uploadIngredientImage,
  findIngredientImageInStorage,
} from "@/lib/supabase/ingredient-images";
import { normalizeIngredientName } from "@/lib/normalizeIngredientName";

/**
 * Tipo: fila de ingrediente del catálogo con nombre e imagen_path en BD
 */
type CatalogRow = {
  name: string;
  image_path: string | null;
};


/**
 * HANDLER GET: /api/ingredients/[name]
 * Obtiene imagen de ingrediente con fallback: BD → Storage → 404
 *
 * Flujo:
 * 1. Normaliza nombre
 * 2. Busca en BD (ingredient_catalog)
 * 3. Si existe → obtiene signed URL
 * 4. Si no → busca en Storage
 * 5. Si nada → 404
 *
 * Query params:
 *   - json=1: Devuelve JSON { name, imagePath, imageUrl }
 *   - Sin json: Redirige directamente a la imagen
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const ingredientName = normalizeIngredientName(name);
    const requestUrl = new URL(req.url);

    console.log(`\n[GET /api/ingredients] Iniciando búsqueda: "${name}" → normalizado: "${ingredientName}"`);

    // Validación: nombre normalizado no debe ser vacío
    if (!ingredientName) {
      console.log(`[GET /api/ingredients] ✗ Nombre normalizado vacío`);
      return NextResponse.json(
        { error: `No se encontró imagen para ${name}` },
        { status: 404 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // PASO 1: Intenta encontrar en BD
    console.log(`[GET /api/ingredients] Consultando BD: ingredient_catalog WHERE name ILIKE "${ingredientName}"`);
    const { data, error } = await supabase
      .from("ingredient_catalog")
      .select("name, image_path")
      .ilike("name", ingredientName)
      .maybeSingle();

    const ingredient = data as CatalogRow | null;

    if (error) {
      console.log(`[GET /api/ingredients] ✗ Error en BD: ${error.message}`);
    } else if (ingredient?.image_path) {
      console.log(`[GET /api/ingredients] ✓ Encontrado en BD: image_path="${ingredient.image_path}"`);
      
      // CASO 1: Obtiene signed URL del image_path en BD
      const imageUrl = await getIngredientSignedImageUrl(ingredient.image_path);
      
      if (imageUrl) {
        return respondWithImage(imageUrl, ingredient.name, ingredient.image_path, requestUrl);
      }
      
      // Si signed URL falla, intenta fallback de storage
      console.log(`[GET /api/ingredients] Signed URL falló, intentando fallback de storage...`);
    } else {
      console.log(`[GET /api/ingredients] ✗ No encontrado en BD o sin image_path`);
    }

    // PASO 2: Fallback a Storage
    console.log(`[GET /api/ingredients] Buscando fallback en storage...`);
    const storageResult = await findIngredientImageInStorage(ingredientName);

    if (storageResult) {
      return respondWithImage(storageResult.imageUrl, ingredientName, storageResult.imagePath, requestUrl);
    }

    // PASO 3: No encontrado en ningún lado
    console.log(`[GET /api/ingredients] ✗ No encontrado en BD ni storage → 404`);
    return NextResponse.json(
      { error: `No se encontró imagen para ${decodeURIComponent(name)}` },
      { status: 404 }
    );
  } catch (err) {
    console.error(`[GET /api/ingredients] ✗ Error inesperado:`, err);
    return NextResponse.json(
      { error: "Error al cargar la imagen" },
      { status: 500 }
    );
  }
}

/**
 * Helper: responde con imagen (JSON o redirect)
 */
function respondWithImage(
  imageUrl: string,
  ingredientName: string,
  imagePath: string,
  requestUrl: URL
) {
  const isJsonMode = requestUrl.searchParams.get("json") === "1";

  if (isJsonMode) {
    console.log(`[GET /api/ingredients] ✓ Respondiendo en modo JSON`);
    return NextResponse.json({
      name: ingredientName,
      imagePath,
      imageUrl,
    });
  }

  console.log(`[GET /api/ingredients] ✓ Redirigiendo a imagen`);
  return NextResponse.redirect(imageUrl);
}

/**
 * HANDLER POST: /api/ingredients/[name]
 * Sube imagen de ingrediente al storage Supabase (solo admin).
 * Flujo: Validación auth → subir a storage → actualizar BD
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    console.log(`\n[POST /api/ingredients] Iniciando subida: "${name}"`);

    // Validación 1: Autenticación
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      console.log(`[POST /api/ingredients] ✗ Sin autenticación`);
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    console.log(`[POST /api/ingredients] Usuario: ${sessionUser.username}, role: ${sessionUser.role}`);

    // Validación 2: Solo admin
    if (sessionUser.role !== "admin") {
      console.log(`[POST /api/ingredients] ✗ No autorizado: role=${sessionUser.role}`);
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const ingredientName = normalizeIngredientName(name);

    if (!ingredientName) {
      console.log(`[POST /api/ingredients] ✗ Nombre vacío después de normalizar`);
      return NextResponse.json(
        { error: "Se requiere nombre del ingrediente" },
        { status: 400 }
      );
    }

    console.log(`[POST /api/ingredients] Nombre normalizado: "${ingredientName}"`);

    // Extrae archivo
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      console.log(`[POST /api/ingredients] ✗ No es un archivo válido`);
      return NextResponse.json(
        { error: "Se requiere un archivo de imagen" },
        { status: 400 }
      );
    }

    console.log(`[POST /api/ingredients] Archivo: ${file.name} (${file.type}, ${file.size} bytes)`);

    // PASO 1: Subir a storage
    console.log(`[POST /api/ingredients] Subiendo imagen a storage...`);
    const imagePath = await uploadIngredientImage({
      ingredientName,
      file,
    });

    console.log(`[POST /api/ingredients] ✓ Imagen subida: ${imagePath}`);

    // PASO 2: Actualizar BD
    console.log(`[POST /api/ingredients] Actualizando BD: ingredient_catalog WHERE name ILIKE "${ingredientName}"`);
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("ingredient_catalog")
      .update({ image_path: imagePath })
      .ilike("name", ingredientName)
      .select("name, image_path")
      .maybeSingle();

    if (error || !data) {
      console.log(`[POST /api/ingredients] ✗ Error actualizando BD: ${error?.message || "sin datos"}`);
      return NextResponse.json(
        { error: "La imagen se subió, pero no se pudo actualizar el catálogo" },
        { status: 500 }
      );
    }

    console.log(`[POST /api/ingredients] ✓ BD actualizada, obteniendo signed URL...`);
    const imageUrl = await getIngredientSignedImageUrl(data.image_path);

    console.log(`[POST /api/ingredients] ✓ Éxito, respondiendo con ingrediente actualizado`);
    return NextResponse.json({
      name: data.name,
      imagePath: data.image_path,
      imageUrl,
    });
  } catch (err) {
    console.error(`[POST /api/ingredients] ✗ Error inesperado:`, err);
    return NextResponse.json(
      { error: "Error al subir la imagen" },
      { status: 500 }
    );
  }
}
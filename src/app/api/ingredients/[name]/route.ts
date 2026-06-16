import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

const IMAGE_BUCKET = process.env.SUPABASE_INGREDIENTS_BUCKET || "ingredients";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

    const ingredientName = decodeURIComponent(name).trim();
    const supabase = getSupabase();

    if (!ingredientName) {
      return NextResponse.json({ error: "No se encontró imagen" }, { status: 404 });
    }

    const { data, error } = (await supabase
      .from("ingredient_catalog")
      .select("name, image_path")
      .eq("name", ingredientName)
      .maybeSingle()) as {
      data: { name: string; image_path: string | null } | null;
      error: { message: string } | null;
    };

    if (error || !data || !data.image_path) {
      return NextResponse.json({ error: "No se encontró imagen" }, { status: 404 });
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .download(data.image_path);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: "No se pudo descargar la imagen" }, { status: 404 });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Error al cargar la imagen" }, { status: 500 });
  }
}
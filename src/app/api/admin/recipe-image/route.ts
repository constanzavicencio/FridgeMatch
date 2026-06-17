import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugifyRecipeTitle, RECIPES_BUCKET, RECIPES_IMAGE_FOLDER } from "@/lib/supabase/recipe-images";

const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(req: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (sessionUser.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const title = String(formData.get("title") ?? "").trim();
  const file = formData.get("image");

  if (!title) {
    return NextResponse.json({ error: "Se requiere el título" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Se requiere una imagen" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Solo se aceptan imágenes JPG o PNG" },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "La imagen no puede superar 2 MB" },
      { status: 400 }
    );
  }

  const slug = slugifyRecipeTitle(title);

  if (!slug) {
    return NextResponse.json({ error: "Título inválido para generar nombre de imagen" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${RECIPES_IMAGE_FOLDER}/${slug}.${ext}`;

  const supabase = createSupabaseAdminClient();

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from(RECIPES_BUCKET)
    .upload(path, buffer, { upsert: true, contentType: file.type });

  if (error) {
    return NextResponse.json(
      { error: "No se pudo subir la imagen", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, path }, { status: 201 });
}

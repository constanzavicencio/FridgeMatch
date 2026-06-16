import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabase } from "@/lib/supabase-server";

const SECRET = process.env.AUTH_SECRET || "dev-secret";
const IMAGE_BUCKET = process.env.SUPABASE_INGREDIENTS_BUCKET || "ingredients";

type IngredientEquivalenceInput = {
  fromQuantity: string | number;
  fromUnit: string;
  toQuantity: string | number;
  toUnit: string;
  note?: string;
};

type IngredientCatalogRow = {
  id: number;
  name: string;
  allowed_units: unknown;
  equivalences: unknown;
  image_path: string | null;
  created_by: string;
  created_at: string;
};

function verifyToken(token: string) {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [username, ts, sig] = decoded.split(":");
    const payload = `${username}:${ts}`;
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    if (expected !== sig) return null;
    return username;
  } catch {
    return null;
  }
}

function getUsername(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  return verifyToken(auth.replace("Bearer ", ""));
}

async function getCurrentUser(username: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("id, username, role")
    .eq("username", username)
    .maybeSingle();

  if (error || !data) return null;
  return data as { id: number; username: string; role: "user" | "admin" };
}

function normalizeList(values: unknown) {
  if (!Array.isArray(values)) return [] as string[];
  return values
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function normalizeEquivalences(values: unknown) {
  if (!Array.isArray(values)) return [] as Array<Record<string, unknown>>;

  return values
    .map((value) => {
      if (!value || typeof value !== "object") return null;
      const equivalence = value as IngredientEquivalenceInput;
      const fromQuantity = Number(equivalence.fromQuantity);
      const toQuantity = Number(equivalence.toQuantity);
      const fromUnit = String(equivalence.fromUnit || "").trim();
      const toUnit = String(equivalence.toUnit || "").trim();
      const note = String(equivalence.note || "").trim();

      if (!Number.isFinite(fromQuantity) || !Number.isFinite(toQuantity) || !fromUnit || !toUnit) {
        return null;
      }

      return {
        fromQuantity,
        fromUnit,
        toQuantity,
        toUnit,
        note: note || undefined,
      };
    })
    .filter(Boolean) as Array<Record<string, unknown>>;
}

export async function GET(req: Request) {
  const username = getUsername(req);
  if (!username) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const currentUser = await getCurrentUser(username);
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("ingredient_catalog")
    .select("id, name, allowed_units, equivalences, image_path, created_by, created_at")
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "No se pudo cargar el catálogo" }, { status: 500 });
  }

  const rows = (data ?? []) as Array<{
    id: number;
    name: string;
    allowed_units: unknown;
    equivalences: unknown;
    image_path: string | null;
    created_by: string;
    created_at: string;
  }>;

  return NextResponse.json({
    ingredients: rows.map((item) => {
      const imageUrl = item.image_path
        ? supabase.storage.from(IMAGE_BUCKET).getPublicUrl(item.image_path).data.publicUrl
        : null;

      return {
        id: item.id,
        name: item.name,
        allowedUnits: normalizeList(item.allowed_units),
        equivalences: normalizeEquivalences(item.equivalences),
        imagePath: item.image_path,
        imageUrl,
        createdBy: item.created_by,
        createdAt: item.created_at,
      };
    }),
  });
}

export async function POST(req: Request) {
  const username = getUsername(req);
  if (!username) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const currentUser = await getCurrentUser(username);
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const name = String(formData.get("name") || "").trim();
  const allowedUnitsRaw = formData.get("allowedUnits");
  const equivalencesRaw = formData.get("equivalences");
  const imageFile = formData.get("image") as File | null;

  const allowedUnits = normalizeList(
    typeof allowedUnitsRaw === "string" ? JSON.parse(allowedUnitsRaw) : allowedUnitsRaw
  );
  const equivalences = normalizeEquivalences(
    typeof equivalencesRaw === "string" ? JSON.parse(equivalencesRaw) : equivalencesRaw
  );

  if (!name) {
    return NextResponse.json({ error: "Se requiere nombre" }, { status: 400 });
  }

  let imagePath: string | null = null;
  let imageUrl: string | null = null;

  if (imageFile && imageFile.size > 0) {
    // Only PNG allowed, max 500KB
    if (imageFile.type !== "image/png") {
      return NextResponse.json({ error: "Solo se permiten imágenes PNG" }, { status: 400 });
    }

    if (imageFile.size > 500 * 1024) {
      return NextResponse.json({ error: "La imagen no puede superar 500KB" }, { status: 400 });
    }

    try {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const supabase = getSupabase();

      const safeName = name.replace(/[^a-z0-9-_]/gi, "_").toLowerCase();
      const filename = `${safeName}-${Date.now()}.png`;
      const storagePath = `catalog/${filename}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(storagePath, buffer, { contentType: "image/png", upsert: true });

      if (uploadError) {
        return NextResponse.json({ error: `No se pudo subir la imagen al storage: ${uploadError.message}` }, { status: 500 });
      }

      imagePath = uploadData?.path ?? null;

      // get public URL (works only if bucket is public)
      if (imagePath) {
        const { data: publicData } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(imagePath);
        imageUrl = publicData?.publicUrl ?? null;
      }
    } catch {
      return NextResponse.json({ error: "No se pudo procesar la imagen" }, { status: 500 });
    }
  }

  const supabase = getSupabase();
  const { data, error } = (await (supabase as unknown as { from: (table: string) => any })
    .from("ingredient_catalog")
    .upsert(
      {
        name,
        allowed_units: allowedUnits,
        equivalences,
        image_path: imagePath,
        created_by: username,
      },
      { onConflict: "name" }
    )
    .select("id, name, allowed_units, equivalences, image_path, created_by, created_at")
    .single()) as { data: IngredientCatalogRow | null; error: { message: string } | null };

  if (error || !data) {
    return NextResponse.json({ error: "No se pudo guardar el ingrediente" }, { status: 500 });
  }

  return NextResponse.json(
    {
        ingredient: {
        id: data.id,
        name: data.name,
        allowedUnits: normalizeList(data.allowed_units),
        equivalences: normalizeEquivalences(data.equivalences),
        imagePath: data.image_path,
        imageUrl: imageUrl,
        createdBy: data.created_by,
        createdAt: data.created_at,
      },
    },
    { status: 201 }
  );
}

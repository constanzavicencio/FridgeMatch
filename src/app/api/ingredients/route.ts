import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getIngredientSignedImageUrl } from "@/lib/supabase/ingredient-images";

type IngredientRow = {
  id: number;
  username: string;
  name: string;
  quantity: number | string;
  unit: string;
  created_at: string;
};

type CatalogRow = {
  name: string;
  image_path: string | null;
};

async function formatIngredient(
  ingredient: IngredientRow,
  catalogByName: Map<string, CatalogRow>
) {
  const catalog = catalogByName.get(ingredient.name.toLowerCase());
  const imagePath = catalog?.image_path ?? null;

  return {
    id: ingredient.id,
    username: ingredient.username,
    name: ingredient.name,
    quantity: Number(ingredient.quantity),
    unit: ingredient.unit,
    createdAt: ingredient.created_at,
    imagePath,
    imageUrl: await getIngredientSignedImageUrl(imagePath),
  };
}

async function getCatalogByNames(names: string[]) {
  const supabase = createSupabaseAdminClient();

  if (names.length === 0) {
    return new Map<string, CatalogRow>();
  }

  const { data } = await supabase
    .from("ingredient_catalog")
    .select("name, image_path")
    .in("name", names);

  const catalogByName = new Map<string, CatalogRow>();

  for (const item of (data ?? []) as CatalogRow[]) {
    catalogByName.set(item.name.toLowerCase(), item);
  }

  return catalogByName;
}

export async function GET() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("ingredients")
    .select("id, username, name, quantity, unit, created_at")
    .eq("username", sessionUser.username)
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar los ingredientes" },
      { status: 500 }
    );
  }

  const rows = (data ?? []) as IngredientRow[];
  const names = [...new Set(rows.map((ingredient) => ingredient.name))];
  const catalogByName = await getCatalogByNames(names);
  const formattedRows = await Promise.all(
    rows.map((ingredient) => formatIngredient(ingredient, catalogByName))
  );

  return NextResponse.json({
    ingredients: formattedRows,
  });
}

export async function POST(req: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body.name || "").trim();
  const unit = String(body.unit || "unidad").trim();
  const parsedQuantity = Number(body.quantity);

  if (!name || body.quantity === undefined) {
    return NextResponse.json(
      { error: "Se requieren nombre y cantidad" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(parsedQuantity)) {
    return NextResponse.json(
      { error: "Cantidad inválida" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("ingredients")
    .select("id, username, name, quantity, unit, created_at")
    .eq("username", sessionUser.username)
    .ilike("name", name)
    .ilike("unit", unit)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      { error: "No se pudo guardar el ingrediente" },
      { status: 500 }
    );
  }

  let savedIngredient: IngredientRow | null = null;

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("ingredients")
      .update({ quantity: Number(existing.quantity) + parsedQuantity })
      .eq("id", Number(existing.id))
      .eq("username", sessionUser.username)
      .select("id, username, name, quantity, unit, created_at")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: "No se pudo guardar el ingrediente" },
        { status: 500 }
      );
    }

    savedIngredient = updated as IngredientRow;
  } else {
    const { data: ingredient, error } = await supabase
      .from("ingredients")
      .insert({
        username: sessionUser.username,
        name,
        quantity: parsedQuantity,
        unit,
      })
      .select("id, username, name, quantity, unit, created_at")
      .single();

    if (error || !ingredient) {
      return NextResponse.json(
        { error: "No se pudo guardar el ingrediente" },
        { status: 500 }
      );
    }

    savedIngredient = ingredient as IngredientRow;
  }

  const catalogByName = await getCatalogByNames([savedIngredient.name]);

  return NextResponse.json(
    {
      ingredient: await formatIngredient(savedIngredient, catalogByName),
    },
    { status: existing ? 200 : 201 }
  );
}

export async function PUT(req: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, name, quantity, unit } = body;

  if (!id) {
    return NextResponse.json({ error: "Se requiere id" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (name !== undefined) updates.name = String(name).trim();
  if (quantity !== undefined) updates.quantity = Number(quantity);
  if (unit !== undefined) updates.unit = String(unit).trim();

  if (
    updates.quantity !== undefined &&
    !Number.isFinite(Number(updates.quantity))
  ) {
    return NextResponse.json(
      { error: "Cantidad inválida" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();

  const { data: ingredient, error } = await supabase
    .from("ingredients")
    .update(updates)
    .eq("id", Number(id))
    .eq("username", sessionUser.username)
    .select("id, username, name, quantity, unit, created_at")
    .maybeSingle();

  if (error || !ingredient) {
    return NextResponse.json(
      { error: "ingredient not found" },
      { status: 404 }
    );
  }

  const row = ingredient as IngredientRow;
  const catalogByName = await getCatalogByNames([row.name]);

  return NextResponse.json({
    ingredient: await formatIngredient(row, catalogByName),
  });
}

export async function DELETE(req: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Se requiere id" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("ingredients")
    .delete()
    .eq("id", Number(id))
    .eq("username", sessionUser.username)
    .select("id");

  if (error || !data || data.length === 0) {
    return NextResponse.json(
      { error: "ingredient not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
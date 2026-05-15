import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabase } from "@/lib/supabase-server";

const SECRET = process.env.AUTH_SECRET || "dev-secret";

function verifyToken(token: string) {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [username, ts, sig] = decoded.split(":");
    const payload = `${username}:${ts}`;
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    if (expected !== sig) return null;
    return username;
  } catch (e) {
    return null;
  }
}

function getUsername(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.replace("Bearer ", "");
  return verifyToken(token);
}

export async function GET(req: Request) {
  const username = getUsername(req);
  if (!username) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = getSupabase();

  const { data: ingredients, error } = await supabase
    .from("ingredients")
    .select("id, username, name, quantity, unit, created_at")
    .eq("username", username)
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "No se pudieron cargar los ingredientes" }, { status: 500 });
  }

  const rows = (ingredients ?? []) as any[];

  return NextResponse.json({
    ingredients: rows.map((ingredient) => ({
      id: ingredient.id,
      username: ingredient.username,
      name: ingredient.name,
      quantity: Number(ingredient.quantity),
      unit: ingredient.unit,
      createdAt: ingredient.created_at,
    })),
  });
}

export async function POST(req: Request) {
  const username = getUsername(req);
  if (!username) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const supabase = getSupabase();
  
  const body = await req.json();
  const { name, quantity, unit } = body;
  if (!name || quantity === undefined) {
    return NextResponse.json({ error: "Se requieren nombre y cantidad" }, { status: 400 });
  }

  const { data: ingredient, error } = await supabase
    .from("ingredients")
    .insert({
      username,
      name,
      quantity: parseFloat(quantity),
      unit: unit || "unidad",
    })
    .select("id, username, name, quantity, unit, created_at")
    .single();

  if (error || !ingredient) {
    return NextResponse.json({ error: "No se pudo guardar el ingrediente" }, { status: 500 });
  }

  return NextResponse.json({
    ingredient: {
      id: ingredient.id,
      username: ingredient.username,
      name: ingredient.name,
      quantity: Number(ingredient.quantity),
      unit: ingredient.unit,
      createdAt: ingredient.created_at,
    },
  }, { status: 201 });
}

export async function PUT(req: Request) {
  const username = getUsername(req);
  if (!username) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const supabase = getSupabase();
  
  const body = await req.json();
  const { id, name, quantity, unit } = body;
  if (!id) return NextResponse.json({ error: "Se requiere id" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (quantity !== undefined) updates.quantity = parseFloat(quantity);
  if (unit !== undefined) updates.unit = unit;

  const { data: ingredient, error } = await supabase
    .from("ingredients")
    .update(updates)
    .eq("id", Number(id))
    .eq("username", username)
    .select("id, username, name, quantity, unit, created_at")
    .maybeSingle();

  if (error || !ingredient) {
    return NextResponse.json({ error: "ingredient not found" }, { status: 404 });
  }

  return NextResponse.json({
    ingredient: {
      id: ingredient.id,
      username: ingredient.username,
      name: ingredient.name,
      quantity: Number(ingredient.quantity),
      unit: ingredient.unit,
      createdAt: ingredient.created_at,
    },
  });
}

export async function DELETE(req: Request) {
  const username = getUsername(req);
  if (!username) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const supabase = getSupabase();
  
  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "Se requiere id" }, { status: 400 });

  const { data, error } = await supabase
    .from("ingredients")
    .delete()
    .eq("id", Number(id))
    .eq("username", username)
    .select("id");

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: "ingredient not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

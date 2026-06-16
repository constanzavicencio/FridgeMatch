import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabase } from "@/lib/supabase-server";

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: Request) {
  const body = await req.json();
  const { username, password, role } = body;
  if (!username || !password) {
    return NextResponse.json({ error: "Se requiere usuario y contraseña" }, { status: 400 });
  }

  const supabase = getSupabase();

  const usersTable = supabase.from("users") as any;

  const { data: existingUser } = await usersTable
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingUser) {
    return NextResponse.json({ error: "Ese nombre de usuario ya se encuentra registrado" }, { status: 409 });
  }

  const { data: user, error } = await usersTable
    .insert({
      username,
      password_hash: hashPassword(password),
      role: role === "admin" ? "admin" : "user",
    })
    .select("id, username, role")
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "Error al intentar completar el registro" }, { status: 500 });
  }

  return NextResponse.json({ user }, { status: 201 });
}

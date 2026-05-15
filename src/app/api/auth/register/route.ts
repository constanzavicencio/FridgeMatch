import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabase } from "@/lib/supabase-server";

const SECRET = process.env.AUTH_SECRET || "dev-secret";

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: Request) {
  const body = await req.json();
  const { username, password, role } = body;
  if (!username || !password) {
    return NextResponse.json({ error: "Se requieren usuario y contraseña" }, { status: 400 });
  }

  const supabase = getSupabase();

  const usersTable = supabase.from("users") as any;

  const { data: existingUser } = await usersTable
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingUser) {
    return NextResponse.json({ error: "El usuario ya existe" }, { status: 409 });
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
    return NextResponse.json({ error: "No se pudo completar el registro" }, { status: 500 });
  }

  return NextResponse.json({ user }, { status: 201 });
}

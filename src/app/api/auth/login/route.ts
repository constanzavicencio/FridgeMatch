import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabase } from "@/lib/supabase-server";

const SECRET = process.env.AUTH_SECRET || "dev-secret";

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function makeToken(username: string) {
  const payload = `${username}:${Date.now()}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64");
}

type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  role: "user" | "admin";
};

export async function POST(req: Request) {
  const body = await req.json();
  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json({ error: "Se requieren usuario y contraseña" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("users")
    .select("id, username, password_hash, role")
    .eq("username", username)
    .maybeSingle();

  const user = data as UserRow | null;

  if (error || !user) {
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });
  }

  if (user.password_hash !== hashPassword(password)) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const token = makeToken(username);
  const safe = { id: user.id, username: user.username, role: user.role };
  return NextResponse.json({ token, user: safe });
}

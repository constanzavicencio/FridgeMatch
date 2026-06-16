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

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return NextResponse.json({ error: "missing token" }, { status: 401 });
  const token = auth.replace("Bearer ", "");
  const username = verifyToken(token);
  if (!username) return NextResponse.json({ error: "invalid token" }, { status: 401 });

  const supabase = getSupabase();

  type UserRow = { id: number; username: string; role: string };

  const { data, error } = await supabase
    .from("users")
    .select("id, username, role")
    .eq("username", username)
    .maybeSingle();

  const user = data as UserRow | null;

  if (error) return NextResponse.json({ error: "Error al cargar información del usuario" }, { status: 404 });

  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  return NextResponse.json({ user });
}

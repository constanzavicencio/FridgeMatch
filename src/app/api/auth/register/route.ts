import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "Se requiere usuario y contraseña" },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "El usuario debe tener al menos 3 caracteres" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "Ese nombre de usuario ya se encuentra registrado" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        username,
        password_hash: passwordHash,
        role: "user",
      })
      .select("id, username, role")
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Error al intentar completar el registro" },
        { status: 500 }
      );
    }

    await setSessionCookie({
      username: user.username,
      role: user.role,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Register route error:", error);
    return NextResponse.json(
      { error: "Error interno en registro" },
      { status: 500 }
    );
  }
}
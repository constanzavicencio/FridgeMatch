import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { setSessionCookie } from "@/lib/auth/session";

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  role: "user" | "admin";
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "Se requieren usuario y contraseña" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("users")
      .select("id, username, password_hash, role")
      .eq("username", username)
      .maybeSingle();

    const user = data as UserRow | null;

    if (error || !user) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    let validPassword = false;
    let shouldUpgradeHash = false;

    if (user.password_hash.startsWith("$2")) {
      validPassword = await bcrypt.compare(password, user.password_hash);
    } else {
      validPassword = user.password_hash === hashPassword(password);
      shouldUpgradeHash = validPassword;
    }

    if (!validPassword) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    if (shouldUpgradeHash) {
      const upgradedHash = await bcrypt.hash(password, 12);
      await supabase
        .from("users")
        .update({ password_hash: upgradedHash })
        .eq("id", user.id);
    }

    await setSessionCookie({
      username: user.username,
      role: user.role,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login route error:", error);

    return NextResponse.json(
      {
        error: "Error interno en login",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
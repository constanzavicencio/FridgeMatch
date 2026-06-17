import { NextResponse } from "next/server";
import { getSessionUser, clearSessionCookie } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, username, role")
    .eq("username", sessionUser.username)
    .maybeSingle();

  if (error || !data) {
    await clearSessionCookie();
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: data });
}

export async function DELETE() {
  await clearSessionCookie();

  return NextResponse.json({ success: true });
}
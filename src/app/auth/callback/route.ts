import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/home";

  if (code) {
    // Exchange the code on a client page so the session is stored in localStorage
    return NextResponse.redirect(
      new URL(`/auth/confirm?code=${code}&next=${encodeURIComponent(next)}`, request.url)
    );
  }

  // No code param — the token may be in the hash fragment (#access_token=...).
  // Redirect to the confirm page; the Supabase client will detect the hash automatically
  // via detectSessionInUrl and exchange it for a session.
  return NextResponse.redirect(
    new URL(`/auth/confirm?next=${encodeURIComponent(next)}`, request.url)
  );
}

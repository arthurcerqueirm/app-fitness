import { NextResponse } from "next/server";

// Forward the code to a client-side page so the session exchange
// happens in the browser and gets stored in localStorage.
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/home";

  if (code) {
    return NextResponse.redirect(
      new URL(`/auth/confirm?code=${code}&next=${encodeURIComponent(next)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL(next, request.url));
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const isAuthPage = path.startsWith("/login") || path.startsWith("/signup") || path.startsWith("/callback");
  const isOnboardingPage = path.startsWith("/add-to-homescreen") || path.startsWith("/native-lang") || path.startsWith("/target-lang") || path.startsWith("/first-deck");

  // Not logged in: only allow auth pages
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in: redirect away from auth pages
  if (user && isAuthPage) {
    // Check onboarding status to decide where to send them
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = profile?.onboarding_completed ? "/decks" : "/add-to-homescreen";
    return NextResponse.redirect(url);
  }

  // Logged in: check onboarding for app pages (not onboarding pages)
  if (user && !isOnboardingPage && !isAuthPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (profile && !profile.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/add-to-homescreen";
      return NextResponse.redirect(url);
    }
  }

  // Logged in + onboarding complete: redirect away from onboarding pages
  if (user && isOnboardingPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/decks";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

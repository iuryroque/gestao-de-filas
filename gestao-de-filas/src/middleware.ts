import { authConfig } from "./server/auth/config";
import NextAuth from "next-auth";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = ["/", "/login", "/totem", "/painel"].includes(nextUrl.pathname);
  const isAuthRoute = nextUrl.pathname === "/login";

  // 1. Permite chamadas de API do Auth sem travas
  if (isApiAuthRoute) return undefined;

  // 2. Se estiver na página de login e JÁ estiver logado, manda pro Dashboard
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
    return undefined;
  }

  // 3. Se não estiver logado e a rota NÃO for pública, manda pro Login
  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  return undefined;
});

// Configura quais rotas o middleware deve vigiar
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

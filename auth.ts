import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || "super_secret_fallback_key_for_development_12345",
  providers: [
    GitHub,
    Google,
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = 
        nextUrl.pathname.startsWith('/compare') ||
        nextUrl.pathname.startsWith('/playground') ||
        nextUrl.pathname.startsWith('/settings') ||
        nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/config-assistant');
      
      if (isProtected) {
        if (isLoggedIn) return true;
        return false; // Redirects to login page
      }
      return true;
    },
  },
});

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      profile(profile) {
        return {
          id: profile.sub || profile.id,
          name: profile.name || profile.given_name || profile.displayName || "",
          email: profile.email || profile.emails?.[0]?.value || "",
          image: profile.picture || profile.avatar_url || profile.image || profile.photos?.[0]?.value || null
        };
      }
    }),

    // Custom LinkedIn OIDC Provider
    {
      id: "linkedin",
      name: "LinkedIn",
      type: "oauth",
      wellKnown: "https://www.linkedin.com/oauth/.well-known/openid-configuration",
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        url: "https://www.linkedin.com/oauth/v2/authorization",
        params: { scope: "openid profile email" }
      },
      token: {
        url: "https://www.linkedin.com/oauth/v2/accessToken",
        params: {
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!
        }
      },
      userinfo: "https://api.linkedin.com/v2/userinfo",
      issuer: "https://www.linkedin.com/oauth",
      profile(profile) {
        return {
          id: profile.sub || profile.id,
          name: profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(" ") || "",
          email: profile.email,
          image: profile.picture || null
        };
      }
    },

    // Keep existing email/password authentication
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

          // Call your Flask backend login API
          const res = await fetch(`${apiUrl}/api/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password
            })
          });

          const data = await res.json();

          if (res.ok && data.userId) {
            return {
              id: data.userId,
              email: data.email,
              name: `${data.firstName} ${data.lastName}`,
              role: data.role,
              token: data.token,
              userId: data.userId
            };
          }

          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // When signing in with OAuth providers, check if user exists
      if (account?.provider === "google" || account?.provider === "linkedin") {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

          // Check if user already exists in backend
          const checkRes = await fetch(`${apiUrl}/api/users/check-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email })
          });

          if (!checkRes.ok) {
            console.error("Failed to check email:", await checkRes.text());
            return `/auth/error?error=server_error`;
          }

          const checkData = await checkRes.json();

          if (checkData.exists) {
            // Existing user - authenticate them
            const res = await fetch(`${apiUrl}/api/users/oauth-login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                provider: account.provider,
                providerId: account.providerAccountId,
                image: user.image
              })
            });

            const data = await res.json();

            if (res.ok && data.user) {
              user.id = data.user.id || data.user._id;
              user.role = data.user.role;
              user.needsRoleSelection = false;
              user.image = user.image || data.user.image;
              return true;
            }

            console.error("OAuth login failed:", data);
            return `/auth/error?error=oauth_login_failed`;
          } else {
            // New user - need role selection
            user.needsRoleSelection = true;
            user.provider = account.provider;
            user.providerId = account.providerAccountId;
            // Preserve profile image from OAuth provider
            user.image = typeof user.image === "string" ? user.image : (typeof profile?.image === "string" ? profile.image : undefined);
            return true;
          }
        } catch (error) {
          console.error("OAuth sign-in error:", error);
          return `/auth/error?error=network_error`;
        }
      }

      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      // Handle session updates
      if (trigger === "update" && session?.user) {
        if (session.user.id) token.id = session.user.id;
        if (session.user.role) token.role = session.user.role;
        if (session.user.needsRoleSelection !== undefined) {
          token.needsRoleSelection = session.user.needsRoleSelection;
        }
        return token;
      }

      // Persist user data to token on initial sign-in
      if (user) {
        token.id = typeof user.id === "string" ? user.id : (typeof token.sub === "string" ? token.sub : "");
        token.role = typeof user.role === "string" ? user.role : "";
        token.provider = typeof account?.provider === "string" ? account.provider : undefined;
        token.providerId = typeof user.providerId === "string" ? user.providerId : (typeof account?.providerAccountId === "string" ? account.providerAccountId : undefined);
        token.needsRoleSelection = user.needsRoleSelection === true;
        token.email = typeof user.email === "string" ? user.email : undefined;
        token.name = typeof user.name === "string" ? user.name : undefined;
        token.image = typeof user.image === "string" ? user.image : undefined;
      }
      return token;
    },

    async session({ session, token }) {
      // Add custom properties to session
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.role = typeof token.role === "string" ? token.role : "";
        session.user.provider = typeof token.provider === "string" ? token.provider : undefined;
        session.user.providerId = typeof token.providerId === "string" ? token.providerId : undefined;
        session.user.needsRoleSelection = token.needsRoleSelection === true;
        session.user.image = typeof token.image === "string" ? token.image : undefined;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle auth errors
      if (url.includes('/auth/error')) {
        return url;
      }

      // Default behavior: respect callbackUrl or go to dashboard
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },

  pages: {
    signIn: "/login",
    error: "/auth/error"
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET
});

export { handler as GET, handler as POST };

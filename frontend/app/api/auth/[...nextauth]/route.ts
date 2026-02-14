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
      }
    }),

    // LinkedIn OAuth
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid profile email"
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture
        };
      }
    }),

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

          const checkData = await checkRes.json();

          if (checkData.exists) {
            // User exists - get their full data
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
              // Set user data that will be stored in JWT token
              user.id = data.user.id;
              user.role = data.user.role;
              user.needsRoleSelection = false;
              return true;
            }
            
            console.error("OAuth login failed:", data);
            return false;
          } else {
            // New user - mark as needing registration/role selection
            user.id = "pending";
            user.role = "pending";
            user.needsRoleSelection = true;
            user.provider = account.provider;
            user.providerId = account.providerAccountId;
            return true;
          }
        } catch (error) {
          console.error("OAuth sign-in error:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      // Persist user data to token
      if (user) {
        token.id = user.id;
        token.role = user.role || "candidate";
        token.provider = account?.provider;
        token.providerId = user.providerId || account?.providerAccountId;
        token.needsRoleSelection = user.needsRoleSelection || false;
        token.email = user.email || undefined;
        token.authToken = user.token || user.id;
        token.name = user.name || undefined;
        token.image = user.image || undefined;
      }
      return token;
    },

    async session({ session, token }) {
      // Add custom properties to session
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role || "candidate";
        session.user.provider = token.provider || "";
        session.user.providerId = token.providerId;
        session.user.needsRoleSelection = token.needsRoleSelection;
        session.user.image = token.image;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle OAuth new user redirect - send them to register page step 2
      if (url.includes('needsRoleSelection=true')) {
        return `${baseUrl}/register?oauth=true`;
      }
      // Default behavior
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

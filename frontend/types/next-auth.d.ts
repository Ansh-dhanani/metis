import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
    needsRoleSelection?: boolean;
    providerId?: string;
    provider?: string;
    token?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
      provider?: string;
      providerId?: string;
      needsRoleSelection?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    provider?: string;
    providerId?: string;
    needsRoleSelection?: boolean;
    email?: string;
    name?: string;
    image?: string;
  }
}

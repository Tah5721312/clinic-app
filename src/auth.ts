import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getConnection } from "@/lib/database";
import oracledb from "oracledb";

type OracleUser = {
  ID: number; // alias of USER_ID
  USERNAME: string;
  EMAIL: string;
  PASSWORD: string;
  ROLE_ID?: number | null;
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const email = (creds?.email || "").toString();
        const password = (creds?.password || "").toString();

        if (!email || !password) return null;

        if (
          process.env.ADMIN_EMAIL &&
          process.env.ADMIN_PASSWORD &&
          email === process.env.ADMIN_EMAIL &&
          password === process.env.ADMIN_PASSWORD
        ) {
          return {
            id: "0",
            name: "Super Admin",
            email,
            isAdmin: true,
            roleId: 0,
          } as any;
        }

        let connection;
        try {
          connection = await getConnection();
          const result = await connection.execute<OracleUser>(
            `SELECT USER_ID AS ID, USERNAME, EMAIL, PASSWORD, ROLE_ID FROM tah57.USERS WHERE UPPER(EMAIL) = UPPER(:email)`,
            { email },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
          const user = result.rows?.[0];
          if (!user) return null;
          const ok = await bcrypt.compare(password, user.PASSWORD);
          if (!ok) return null;
          return {
            id: String(user.ID),
            name: user.USERNAME,
            email: user.EMAIL,
            isAdmin: (user.ROLE_ID ?? 0) === 211, // superadmin role id
            roleId: user.ROLE_ID ?? 0,
          } as any;
        } finally {
          if (connection) await connection.close();
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.isAdmin = (user as any).isAdmin ?? false;
        token.roleId = (user as any).roleId ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: String((token as any).id ?? ""),
        name: session.user?.name || "",
        email: session.user?.email || "",
        isAdmin: Boolean((token as any).isAdmin),
        roleId: Number((token as any).roleId ?? 0),
      } as any;
      return session;
    },
  },
});

export { GET as GETAuth, POST as POSTAuth };



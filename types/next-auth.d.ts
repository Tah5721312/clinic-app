import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      isAdmin: boolean
      roleId: number
      isGuest: boolean
    }
  }

  interface User {
    id: string
    name: string
    email: string
    isAdmin: boolean
    roleId: number
    isGuest: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    isAdmin: boolean
    roleId: number
    isGuest: boolean
  }
}

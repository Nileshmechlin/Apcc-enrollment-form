import { cookies } from "next/headers"

const COOKIE_NAME = "admin_auth"
const TOKEN_VALUE = "authenticated" // simple static token

export function validateAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  return password === adminPassword
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)
  return token?.value === TOKEN_VALUE
}

export function getAuthCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: TOKEN_VALUE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  }
}

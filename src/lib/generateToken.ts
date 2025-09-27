import jwt from "jsonwebtoken";
import { JWTPayload } from '@/lib/types';
import { serialize } from "cookie";

// ✅ Generate JWT Token
export function generateJWT(jwtPayload: JWTPayload): string {
  const privateKey = process.env.JWT_SECRET;
  if (!privateKey) {
    throw new Error("❌ JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign(jwtPayload, privateKey, {
    expiresIn: "30d", // صلاحية 30 يوم
  });
}

// ✅ Set Cookie with JWT
export function setCookie(jwtPayload: JWTPayload): string {
  const token = generateJWT(jwtPayload);

  return serialize("jwtToken", token, {
    httpOnly: true, // ممنوع يتقرا من JS (XSS Protection)
    secure: process.env.NODE_ENV === "production", // بس في https في الـ production
    sameSite: "strict", // يمنع CSRF
    path: "/", // صالح لكل المسارات
    maxAge: 60 * 60 * 24 * 30, // 30 يوم
  });
}

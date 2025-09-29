// lib/generateToken.ts (محدث)
import jwt from "jsonwebtoken";
import { JWTPayload } from '@/lib/types';
import { serialize } from "cookie";

// ✅ Generate JWT Token (محدث ليشمل الأدوار والصلاحيات)
export function generateJWT(jwtPayload: JWTPayload): string {
  const privateKey = process.env.JWT_SECRET;
  if (!privateKey) {
    throw new Error("❌ JWT_SECRET is not defined in environment variables");
  }
  
  return jwt.sign(jwtPayload, privateKey, {
    expiresIn: "30d", // صلاحية 30 يوم
  });
}

// ✅ Set Cookie with JWT (محدث)
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

// ✅ دالة جديدة لإنشاء JWT مع الأدوار والصلاحيات (للاستخدام المستقبلي)
export async function generateJWTWithRole(
  user: {
    id: number;
    username: string;
    isAdmin: boolean;
    roleId?: number;
  },
  connection?: any // Oracle connection للاستخدام إذا كان متاح
): Promise<JWTPayload> {
  
  let roleInfo = { roleName: null, permissions: [] };
  
  // إذا كان عندنا connection متاح، نجلب البيانات من قاعدة البيانات
  if (connection && user.roleId) {
    try {
      // جلب اسم الدور
      const roleResult = await connection.execute(
        `SELECT NAME FROM TAH57.ROLES WHERE ROLES_ID = :roleId AND IS_ACTIVE = 1`,
        { roleId: user.roleId }
      );
      
      // جلب الصلاحيات
      const permissionsResult = await connection.execute(
        `SELECT DISTINCT p.NAME
         FROM TAH57.ROLE_PERMISSIONS rp
         JOIN TAH57.PERMISSIONS p ON rp.ROLE_PERMISSIONS_ID = p.PERMISSIONS_ID
         WHERE rp.ROLE_ID = :roleId AND p.IS_ACTIVE = 1`,
        { roleId: user.roleId }
      );

      roleInfo = {
        roleName: roleResult.rows?.[0]?.[0] || null,
        permissions: permissionsResult.rows?.map((row: any) => row[0]) || []
      };
      
    } catch (error) {
      console.error('Error fetching user role and permissions:', error);
    }
  }
  
  const payload: JWTPayload = {
    id: user.id,
    username: user.username,
    isAdmin: user.isAdmin,
    roleId: user.roleId,
    roleName: roleInfo.roleName,
    permissions: roleInfo.permissions
  };
  
  return payload;
}

// دالة مساعدة لجلب الدور والصلاحيات
async function getUserRoleAndPermissions(userId: number): Promise<{
  roleName: string | null;
  permissions: string[];
}> {
  try {
    const oracledb = require('oracledb');
    const connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECTION_STRING
    });

    // جلب الدور
    const roleResult = await connection.execute(`
      SELECT r.NAME as ROLE_NAME
      FROM TAH57.USERS u
      LEFT JOIN TAH57.ROLES r ON u.ROLE_ID = r.ROLES_ID
      WHERE u.ID = :userId AND (r.IS_ACTIVE = 1 OR r.IS_ACTIVE IS NULL)
    `, { userId });

    // جلب الصلاحيات
    const permissionsResult = await connection.execute(`
      SELECT DISTINCT p.NAME
      FROM TAH57.USERS u
      JOIN TAH57.ROLES r ON u.ROLE_ID = r.ROLES_ID
      JOIN TAH57.ROLE_PERMISSIONS rp ON r.ROLES_ID = rp.ROLE_ID
      JOIN TAH57.PERMISSIONS p ON rp.PERMISSION_ID = p.PERMISSIONS_ID
      WHERE u.ID = :userId AND r.IS_ACTIVE = 1 AND p.IS_ACTIVE = 1
    `, { userId });

    await connection.close();

    return {
      roleName: roleResult.rows?.[0]?.[0] || null,
      permissions: permissionsResult.rows?.map((row: any) => row[0]) || []
    };
    
  } catch (error) {
    console.error('Error fetching user role and permissions:', error);
    return {
      roleName: null,
      permissions: []
    };
  }
}
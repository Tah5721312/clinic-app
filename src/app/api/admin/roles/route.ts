import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { getConnection } from "@/lib/database";
import oracledb from "oracledb";

/**
 *  @method  GET
 *  @route   ~/api/admin/roles
 *  @desc    Get All Roles with Permissions
 *  @access  private (Admin only)
 */
export async function GET(request: NextRequest) {
  let connection;
  try {
    // ✅ التحقق من التوكن والصلاحيات
    const userFromToken = verifyToken(request);
    if (!userFromToken) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    if (userFromToken.roleName !== 'SUPER_ADMIN' && userFromToken.roleName !== 'ADMIN') {
      return NextResponse.json({ message: "access denied - admin only" }, { status: 403 });
    }

    connection = await getConnection();

    // ✅ جلب الأدوار
    const rolesResult = await connection.execute(
      `SELECT ID, NAME, DESCRIPTION, IS_ACTIVE, CREATED_AT, UPDATED_AT
       FROM ROLES
       ORDER BY ID`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const roles = rolesResult.rows as any[];

    // ✅ جلب الصلاحيات لكل دور
    for (let role of roles) {
      const permissionsResult = await connection.execute(
        `SELECT p.ID, p.NAME, p.DESCRIPTION, p.MODULE, p.ACTION
         FROM TAH57.ROLE_PERMISSIONS rp
         JOIN TAH57.PERMISSIONS p ON rp.ROLE_PERMISSIONS_ID = p.PERMISSIONS_ID
         WHERE rp.ROLE_ID = :roleId AND p.IS_ACTIVE = 1
         ORDER BY p.MODULE, p.ACTION`,
        { roleId: role.ID },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      role.permissions = permissionsResult.rows || [];
    }

    return NextResponse.json({ roles }, { status: 200 });

  } catch (error) {
    console.error("GET ROLES ERROR:", error);
    return NextResponse.json({ message: "internal server error" }, { status: 500 });
  } finally {
    if (connection) await connection.close();
  }
}
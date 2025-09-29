import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { getConnection } from "@/lib/database";
import oracledb from "oracledb";

/**
 *  @method  PUT
 *  @route   ~/api/admin/users/:id/role
 *  @desc    Change User Role
 *  @access  private (Admin only)
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    // ✅ التحقق من التوكن والصلاحيات
    const userFromToken = verifyToken(request);
    if (!userFromToken) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    const isAdmin = userFromToken.roleName === 'ADMIN';
    const isSuperAdmin = userFromToken.roleName === 'SUPER_ADMIN';

    if (!isAdmin && !isSuperAdmin) {
      return NextResponse.json({ message: "access denied - admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { roleId } = body;

    if (!roleId) {
      return NextResponse.json({ message: "role ID is required" }, { status: 400 });
    }

    connection = await getConnection();

    // ✅ التحقق من وجود المستخدم
    const userResult = await connection.execute(
      `SELECT u.ID, u.USERNAME, r.NAME as CURRENT_ROLE
       FROM USERS u
       LEFT JOIN ROLES r ON u.ROLE_ID = r.ID
       WHERE u.ID = :userId`,
      { userId: params.id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const targetUser = userResult.rows?.[0] as any;
    if (!targetUser) {
      return NextResponse.json({ message: "user not found" }, { status: 404 });
    }

    // ✅ منع تعديل الـ Super Admin (إلا من Super Admin آخر)
    if (targetUser.CURRENT_ROLE === 'SUPER_ADMIN' && !isSuperAdmin) {
      return NextResponse.json(
        { message: "cannot modify super admin role" },
        { status: 403 }
      );
    }

    // ✅ التحقق من صحة الدور الجديد
    const roleResult = await connection.execute(
      `SELECT ID, NAME FROM ROLES WHERE ID = :roleId AND IS_ACTIVE = 1`,
      { roleId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const newRole = roleResult.rows?.[0] as any;
    if (!newRole) {
      return NextResponse.json({ message: "invalid role selected" }, { status: 400 });
    }

    // ✅ فقط الـ Super Admin يقدر يعطي دور Super Admin
    if (newRole.NAME === 'SUPER_ADMIN' && !isSuperAdmin) {
      return NextResponse.json(
        { message: "only super admin can assign super admin role" },
        { status: 403 }
      );
    }

    // ✅ تحديث الدور
    const updateResult = await connection.execute(
      `UPDATE USERS SET ROLE_ID = :roleId WHERE ID = :userId`,
      { roleId, userId: params.id },
      { autoCommit: true }
    );

    if (updateResult.rowsAffected && updateResult.rowsAffected > 0) {
      return NextResponse.json({
        message: `User role updated to ${newRole.NAME} successfully`,
        userId: params.id,
        newRole: newRole.NAME
      }, { status: 200 });
    } else {
      return NextResponse.json({ message: "role update failed" }, { status: 400 });
    }

  } catch (error) {
    console.error("UPDATE USER ROLE ERROR:", error);
    return NextResponse.json({ message: "internal server error" }, { status: 500 });
  } finally {
    if (connection) await connection.close();
  }
}
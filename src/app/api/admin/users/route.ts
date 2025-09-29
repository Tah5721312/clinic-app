// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { getConnection } from "@/lib/database";
import oracledb from "oracledb";

/**
 *  @method  GET
 *  @route   ~/api/admin/users
 *  @desc    Get All Users with Roles (Admin Dashboard)
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

    // ✅ معاملات البحث والترقيم
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const roleFilter = url.searchParams.get('role') || '';

    const offset = (page - 1) * limit;

    // ✅ بناء استعلام البحث
    let whereClause = 'WHERE 1=1';
    let bindVars: any = {};

    if (search) {
      whereClause += ' AND (LOWER(u.USERNAME) LIKE LOWER(:search) OR LOWER(u.EMAIL) LIKE LOWER(:search))';
      bindVars.search = `%${search}%`;
    }

    if (roleFilter) {
      whereClause += ' AND r.NAME = :roleFilter';
      bindVars.roleFilter = roleFilter;
    }

    // ✅ جلب العدد الكلي للمستخدمين
    const countResult = await connection.execute(
      `SELECT COUNT(*) as TOTAL
       FROM TAH57.USERS u
       LEFT JOIN TAH57.ROLES r ON u.ROLE_ID = r.ROLES_ID
       ${whereClause}`,
      bindVars,
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const totalUsers = (countResult.rows?.[0] as any)?.TOTAL || 0;

    // ✅ جلب المستخدمين مع الترقيم
    const usersResult = await connection.execute(
      `SELECT * FROM (
         SELECT u.ID, u.USERNAME, u.EMAIL, u.IS_ADMIN, u.ROLE_ID, u.CREATED_AT,
                r.NAME as ROLE_NAME, r.DESCRIPTION as ROLE_DESCRIPTION,
                ROW_NUMBER() OVER (ORDER BY u.ID DESC) as RN
         FROM TAH57.USERS u
         LEFT JOIN TAH57.ROLES r ON u.ROLE_ID = r.ROLES_ID
         ${whereClause}
       ) WHERE RN > :offset AND RN <= :endRow`,
      { 
        ...bindVars, 
        offset: offset,
        endRow: offset + limit 
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const users = usersResult.rows as any[];

    // ✅ حساب معلومات الترقيم
    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      users: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
        hasNextPage,
        hasPrevPage
      }
    }, { status: 200 });

  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return NextResponse.json({ message: "internal server error" }, { status: 500 });
  } finally {
    if (connection) await connection.close();
  }
}
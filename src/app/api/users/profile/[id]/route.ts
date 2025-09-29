import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { UpdateUserDto, UserFromDB } from "@/lib/types";
import { updateUserSchema } from "@/lib/validationSchemas";
import bcrypt from "bcryptjs";
import { getConnection } from "@/lib/database";
import oracledb from "oracledb";

/**
 *  @method  DELETE
 *  @route   ~/api/users/profile/:id
 *  @desc    Delete Profile
 *  @access  private (only user himself can delete his account)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    connection = await getConnection();

    // ✅ تحقق هل المستخدم موجود مع معلومات الدور
    const result = await connection.execute<UserFromDB>(
      `SELECT u.ID, u.USERNAME, u.EMAIL, u.ROLE_ID, r.NAME as ROLE_NAME
       FROM TAH57.USERS u
       LEFT JOIN TAH57.ROLES r ON u.ROLE_ID = r.ROLES_ID
       WHERE u.ID = :id`,
      [params.id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const user = result.rows?.[0] as any;

    if (!user) {
      return NextResponse.json({ message: "user not found" }, { status: 404 });
    }

    // ✅ تحقق من الـ Token
    const userFromToken = verifyToken(request);
    if (!userFromToken) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    // ✅ فقط المستخدم نفسه أو الـ Admin يقدر يمسح الحساب
    const canDelete = userFromToken.id === user.ID || 
                     userFromToken.roleName === 'SUPER_ADMIN' || 
                     userFromToken.roleName === 'ADMIN';

    if (!canDelete) {
      return NextResponse.json(
        { message: "only user himself or admin can delete this profile" },
        { status: 403 }
      );
    }

    // ✅ منع مسح حساب الـ Super Admin
    if (user.ROLE_NAME === 'SUPER_ADMIN' && userFromToken.id !== user.ID) {
      return NextResponse.json(
        { message: "cannot delete super admin account" },
        { status: 403 }
      );
    }

    const deleteRes = await connection.execute(
      `DELETE FROM TAH57.USERS WHERE ID = :id`,
      [params.id],
      { autoCommit: true }
    );

    if (deleteRes.rowsAffected && deleteRes.rowsAffected > 0) {
      return NextResponse.json(
        { message: "profile has been deleted successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "failed to delete profile" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("DELETE PROFILE ERROR:", error);
    return NextResponse.json({ message: "internal server error" }, { status: 500 });
  } finally {
    if (connection) await connection.close();
  }
}

/**
 *  @method  GET
 *  @route   ~/api/users/profile/:id
 *  @desc    Get Profile By Id
 *  @access  private (user himself, admin, or doctors can view patient profiles)
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    connection = await getConnection();

    // ✅ جلب بيانات المستخدم مع معلومات الدور والصلاحيات
    const result = await connection.execute(
      `SELECT u.ID, u.USERNAME, u.EMAIL, u.IS_ADMIN, u.ROLE_ID, u.CREATED_AT,
              r.NAME as ROLE_NAME, r.DESCRIPTION as ROLE_DESCRIPTION
       FROM TAH57.USERS u
       LEFT JOIN TAH57.ROLES r ON u.ROLE_ID = r.ROLES_ID
       WHERE u.ID = :id`,
      [params.id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const user = result.rows?.[0] as any;
    if (!user) {
      return NextResponse.json({ message: "user not found" }, { status: 404 });
    }

    // ✅ تحقق من التوكن
    const userFromToken = verifyToken(request);
    if (!userFromToken) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    // ✅ تحديد من يقدر يشوف البروفايل
    const canView = userFromToken.id === user.ID || // المستخدم نفسه
                   userFromToken.roleName === 'SUPER_ADMIN' || // Super Admin
                   userFromToken.roleName === 'ADMIN' || // Admin
                   (userFromToken.roleName === 'DOCTOR' && user.ROLE_NAME === 'PATIENT') || // الطبيب يشوف المرضى
                   (userFromToken.roleName === 'RECEPTIONIST' && user.ROLE_NAME === 'PATIENT'); // الاستقبال يشوف المرضى

    if (!canView) {
      return NextResponse.json({ message: "access denied" }, { status: 403 });
    }

    // ✅ جلب الصلاحيات إذا كان المستخدم يطلب بروفايله الشخصي أو كان admin
    type PermissionRow = {
      NAME: string;
      DESCRIPTION: string;
    };
    
    let permissions: PermissionRow[] = [];
    
    if (userFromToken.id === user.ID || userFromToken.roleName === 'SUPER_ADMIN' || userFromToken.roleName === 'ADMIN') {
      
      const permissionsResult = await connection.execute<PermissionRow>(
         `SELECT DISTINCT p.NAME, p.DESCRIPTION
         FROM TAH57.USERS u
         JOIN TAH57.ROLES r ON u.ROLE_ID = r.ROLES_ID
         JOIN TAH57.ROLE_PERMISSIONS rp ON r.ID = rp.ROLE_ID
         JOIN TAH57.PERMISSIONS p ON rp.ROLE_PERMISSIONS_ID = p.PERMISSIONS_ID
         WHERE u.ID = :userId AND r.IS_ACTIVE = 1 AND p.IS_ACTIVE = 1`,
        { userId: user.ID },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      permissions = permissionsResult.rows || [];
    }

    // ✅ إرجاع بيانات المستخدم (بدون كلمة المرور)
    const userProfile = {
      id: user.ID,
      username: user.USERNAME,
      email: user.EMAIL,
      isAdmin: Boolean(user.IS_ADMIN),
      roleId: user.ROLE_ID,
      roleName: user.ROLE_NAME,
      roleDescription: user.ROLE_DESCRIPTION,
      permissions: permissions,
      createdAt: user.CREATED_AT
    };

    return NextResponse.json(userProfile, { status: 200 });

  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    return NextResponse.json({ message: "internal server error" }, { status: 500 });
  } finally {
    if (connection) await connection.close();
  }
}

/**
 *  @method  PUT
 *  @route   ~/api/users/profile/:id
 *  @desc    Update Profile (basic info) or Update User Role (admin only)
 *  @access  private
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    connection = await getConnection();

    // ✅ تحقق من وجود المستخدم
    const result = await connection.execute(
      `SELECT u.ID, u.USERNAME, u.EMAIL, u.PASSWORD, u.IS_ADMIN, u.ROLE_ID,
              r.NAME as ROLE_NAME
       FROM TAH57.USERS u
       LEFT JOIN TAH57.ROLES r ON u.ROLE_ID = r.ROLES_ID
       WHERE u.ID = :id`,
      [params.id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const user = result.rows?.[0] as any;
    if (!user) {
      return NextResponse.json({ message: "user not found" }, { status: 404 });
    }

    // ✅ تحقق من التوكن
    const userFromToken = verifyToken(request);
    if (!userFromToken) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    // ✅ تحقق من البيانات
    const body = (await request.json()) as UpdateUserDto & { roleId?: number };
    
    // ✅ تحديد ما يمكن تحديثه
    const isUpdatingSelf = userFromToken.id === user.ID;
    const isAdmin = userFromToken.roleName === 'SUPER_ADMIN' || userFromToken.roleName === 'ADMIN';
    const isSuperAdmin = userFromToken.roleName === 'SUPER_ADMIN';

    // ✅ التحقق من الصلاحيات
    if (!isUpdatingSelf && !isAdmin) {
      return NextResponse.json({ message: "access denied" }, { status: 403 });
    }

    // ✅ منع تعديل دور الـ Super Admin
    if (user.ROLE_NAME === 'SUPER_ADMIN' && !isSuperAdmin) {
      return NextResponse.json(
        { message: "cannot modify super admin account" },
        { status: 403 }
      );
    }

    // ✅ التحقق من تحديث الدور (Admin only)
    if (body.roleId && !isAdmin) {
      return NextResponse.json(
        { message: "only admins can change user roles" },
        { status: 403 }
      );
    }

    // ✅ التحقق من صحة الدور الجديد إذا تم تمريره
    if (body.roleId) {
      const roleCheck = await connection.execute(
        `SELECT ROLES_ID, NAME FROM TAH57.ROLES WHERE ROLES_ID = :roleId AND IS_ACTIVE = 1`,
        { roleId: body.roleId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (!roleCheck.rows || roleCheck.rows.length === 0) {
        return NextResponse.json({ message: "invalid role selected" }, { status: 400 });
      }

      // فقط الـ Super Admin يقدر يعطي دور Super Admin
      const newRole = roleCheck.rows[0] as any;
      if (newRole.NAME === 'SUPER_ADMIN' && !isSuperAdmin) {
        return NextResponse.json(
          { message: "only super admin can assign super admin role" },
          { status: 403 }
        );
      }
    }

    // ✅ التحقق من بيانات التحديث الأساسية
    const basicUpdateData = {
      username: body.username,
      email: body.email,
      password: body.password
    };

    const validation = updateUserSchema.safeParse(basicUpdateData);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // ✅ تجهيز كلمة المرور الجديدة
    let hashedPassword = user.PASSWORD;
    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(body.password, salt);
    }

    // ✅ تحديث البيانات
    const updateRes = await connection.execute(
      `UPDATE TAH57.USERS 
       SET USERNAME = :username, EMAIL = :email, PASSWORD = :password, ROLE_ID = :roleId
       WHERE ID = :id`,
      {
        username: body.username || user.USERNAME,
        email: body.email || user.EMAIL,
        password: hashedPassword,
        roleId: body.roleId || user.ROLE_ID,
        id: params.id,
      },
      { autoCommit: true }
    );

    if (updateRes.rowsAffected && updateRes.rowsAffected > 0) {
      // ✅ جلب البيانات المحدثة مع الدور الجديد
      const updatedResult = await connection.execute(
        `SELECT u.ID, u.USERNAME, u.EMAIL, u.IS_ADMIN, u.ROLE_ID,
                r.NAME as ROLE_NAME, r.DESCRIPTION as ROLE_DESCRIPTION
         FROM TAH57.USERS u
         LEFT JOIN TAH57.ROLES r ON u.ROLE_ID = r.ROLES_ID
         WHERE u.ID = :id`,
        [params.id],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const updatedUser = updatedResult.rows?.[0] as any;

      return NextResponse.json(
        {
          id: updatedUser.ID,
          username: updatedUser.USERNAME,
          email: updatedUser.EMAIL,
          isAdmin: Boolean(updatedUser.IS_ADMIN),
          roleId: updatedUser.ROLE_ID,
          roleName: updatedUser.ROLE_NAME,
          roleDescription: updatedUser.ROLE_DESCRIPTION,
          message: "profile updated successfully"
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ message: "update failed" }, { status: 400 });
    }

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return NextResponse.json({ message: "internal server error" }, { status: 500 });
  } finally {
    if (connection) await connection.close();
  }
}
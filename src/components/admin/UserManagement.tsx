// components/admin/UserManagement.tsx
'use client';
import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { RoleBasedButton } from '@/components/RoleBasedButton';
import PermissionGuard from '@/components/PermissionGuard';
import { UserRoles } from '@/lib/types';

interface User {
  ID: number;
  USERNAME: string;
  EMAIL: string;
  IS_ADMIN: boolean;
  ROLE_NAME: string;
  ROLE_DESCRIPTION: string;
  CREATED_AT: string;
}

interface Role {
  ID: number;
  NAME: string;
  DESCRIPTION: string;
  IS_ACTIVE: boolean;
}

export default function UserManagement() {
  const { user: currentUser, hasRole, loading } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // جلب المستخدمين
  const fetchUsers = async (page = 1, search = '') => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users?page=${page}&search=${search}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
      } else {
        throw new Error('فشل في جلب المستخدمين');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showMessage('error', 'حدث خطأ أثناء جلب المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  // جلب الأدوار
  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles);
      } else {
        throw new Error('فشل في جلب الأدوار');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      showMessage('error', 'حدث خطأ أثناء جلب الأدوار');
    }
  };

  // تغيير دور المستخدم
  const changeUserRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.ID}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: selectedRole })
      });

      if (response.ok) {
        await fetchUsers(currentPage, searchTerm);
        setIsModalOpen(false);
        setSelectedUser(null);
        setSelectedRole(null);
        showMessage('success', 'تم تغيير دور المستخدم بنجاح');
      } else {
        const error = await response.json();
        showMessage('error', error.message || 'فشل في تغيير الدور');
      }
    } catch (error) {
      console.error('Error changing user role:', error);
      showMessage('error', 'حدث خطأ أثناء تغيير الدور');
    }
  };

  // حذف المستخدم
  const deleteUser = async (userId: number, username: string) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم ${username}؟`)) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchUsers(currentPage, searchTerm);
        showMessage('success', 'تم حذف المستخدم بنجاح');
      } else {
        const error = await response.json();
        showMessage('error', error.message || 'فشل في حذف المستخدم');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showMessage('error', 'حدث خطأ أثناء حذف المستخدم');
    }
  };

  // عرض الرسائل
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    if (currentUser && (hasRole([UserRoles.ADMIN, UserRoles.SUPER_ADMIN]))) {
      fetchUsers();
      fetchRoles();
    }
  }, [currentUser, hasRole]);

  // البحث
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1, searchTerm);
  };

  // إعادة تعيين البحث
  const handleResetSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    fetchUsers(1, '');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <PermissionGuard
      requiredRole={[UserRoles.ADMIN, UserRoles.SUPER_ADMIN]}
      fallback={
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500 text-center p-8 text-xl">
            ليس لديك صلاحية للوصول لهذه الصفحة
          </div>
        </div>
      }
    >
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">إدارة المستخدمين</h1>
          <p className="text-gray-600">إدارة المستخدمين والأدوار في النظام</p>
        </div>

        {/* رسائل التنبيه */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              placeholder="البحث بالاسم أو الإيميل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              بحث
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                إعادة تعيين
              </button>
            )}
          </form>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{users.length}</div>
            <div className="text-gray-600">إجمالي المستخدمين</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.ROLE_NAME === 'PATIENT').length}
            </div>
            <div className="text-gray-600">مرضى</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">
              {users.filter(u => u.ROLE_NAME === 'DOCTOR').length}
            </div>
            <div className="text-gray-600">أطباء</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">
              {users.filter(u => u.ROLE_NAME === 'ADMIN' || u.ROLE_NAME === 'SUPER_ADMIN').length}
            </div>
            <div className="text-gray-600">مديرين</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-lg">جاري تحميل المستخدمين...</div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد مستخدمين'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المستخدم
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإيميل
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الدور
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاريخ التسجيل
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.ID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                                {user.USERNAME.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="mr-4">
                              <div className="text-sm font-medium text-gray-900">{user.USERNAME}</div>
                              {user.IS_ADMIN && (
                                <div className="text-xs text-blue-600 font-medium">مدير</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.EMAIL}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.ROLE_NAME === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                            user.ROLE_NAME === 'ADMIN' ? 'bg-red-100 text-red-800' :
                            user.ROLE_NAME === 'DOCTOR' ? 'bg-blue-100 text-blue-800' :
                            user.ROLE_NAME === 'PATIENT' ? 'bg-green-100 text-green-800' :
                            user.ROLE_NAME === 'RECEPTIONIST' ? 'bg-yellow-100 text-yellow-800' :
                            user.ROLE_NAME === 'NURSE' ? 'bg-pink-100 text-pink-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.ROLE_NAME || 'غير محدد'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.CREATED_AT).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 rtl:space-x-reverse">
                          {/* زر تغيير الدور */}
                          <RoleBasedButton
                            requiredRole={[UserRoles.SUPER_ADMIN, UserRoles.ADMIN]}
                            onClick={() => {
                              setSelectedUser(user);
                              setSelectedRole(null);
                              setIsModalOpen(true);
                            }}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1 rounded transition-colors"
                            disabled={user.ROLE_NAME === 'SUPER_ADMIN' && currentUser?.roleName !== 'SUPER_ADMIN'}
                          >
                            تغيير الدور
                          </RoleBasedButton>

                          {/* زر عرض الملف الشخصي */}
                          <button
                            onClick={() => window.open(`/admin/users/${user.ID}`, '_blank')}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded transition-colors"
                          >
                            عرض الملف
                          </button>

                          {/* زر الحذف - للـ Super Admin فقط */}
                          <PermissionGuard requiredRole={[UserRoles.SUPER_ADMIN]}>
                            <button
                              onClick={() => deleteUser(user.ID, user.USERNAME)}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded transition-colors"
                              disabled={user.ROLE_NAME === 'SUPER_ADMIN' || user.ID === currentUser?.id}
                            >
                              حذف
                            </button>
                          </PermissionGuard>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => {
                      const newPage = currentPage - 1;
                      setCurrentPage(newPage);
                      fetchUsers(newPage, searchTerm);
                    }}
                    disabled={currentPage <= 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    السابق
                  </button>
                  <button
                    onClick={() => {
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
                      fetchUsers(newPage, searchTerm);
                    }}
                    disabled={currentPage >= totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    التالي
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      صفحة <span className="font-medium">{currentPage}</span> من <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      
                      let pageNum: number;

                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => {
                              setCurrentPage(pageNum);
                              fetchUsers(pageNum, searchTerm);
                            }}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal لتغيير الدور */}
        {isModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
              <h3 className="text-lg font-bold mb-4 text-gray-800">
                تغيير دور المستخدم: {selectedUser.USERNAME}
              </h3>
              
              <div className="mb-4">
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">الدور الحالي:</p>
                  <p className="font-medium text-blue-600">{selectedUser.ROLE_NAME}</p>
                </div>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اختر الدور الجديد:
                </label>
                <select
                  value={selectedRole || ''}
                  onChange={(e) => setSelectedRole(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر دور...</option>
                  {roles
                    .filter(role => {
                      // فقط الـ Super Admin يقدر يعطي دور Super Admin
                      if (role.NAME === 'SUPER_ADMIN') {
                        return currentUser?.roleName === 'SUPER_ADMIN';
                      }
                      return role.IS_ACTIVE;
                    })
                    .map((role) => (
                    <option key={role.ID} value={role.ID}>
                      {role.NAME} - {role.DESCRIPTION}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={changeUserRole}
                  disabled={!selectedRole}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  حفظ التغييرات
                </button>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedUser(null);
                    setSelectedRole(null);
                  }}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
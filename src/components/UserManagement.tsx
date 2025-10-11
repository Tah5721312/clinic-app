'use client';

import { useState, useEffect } from 'react';
import { X, Edit, Trash2, Search, RotateCcw } from 'lucide-react';

// TypeScript interfaces
interface Permission {
  SUBJECT: string;
  ACTION: string;
  FIELD_NAME: string | null;
  CAN_ACCESS: number;
}

interface User {
  USER_ID: number;
  USERNAME: string;
  FULL_NAME: string;
  EMAIL: string;
  ROLE_NAME: string;
  ROLE_ID: number;
  PERMISSIONS: Permission[];
}

interface Role {
  ROLE_ID: number;
  NAME: string;
  DESCRIPTION?: string;
  IS_ACTIVE?: number;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [usernameFilter, setUsernameFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch users
        const usersResponse = await fetch('/api/users');
        const usersData = await usersResponse.json();
        
        if (usersData.users) {
          setUsers(usersData.users);
          setFilteredUsers(usersData.users);
        }

        // Fetch roles
        const rolesResponse = await fetch('/api/roles');
        const rolesData = await rolesResponse.json();
        
        if (rolesData.roles) {
          setRoles(rolesData.roles);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = () => {
    let filtered = users;

    if (usernameFilter) {
      filtered = filtered.filter(user => 
        user.USERNAME.toLowerCase().includes(usernameFilter.toLowerCase())
      );
    }

    if (roleFilter) {
      filtered = filtered.filter(user => user.ROLE_NAME === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleResetSearch = () => {
    setUsernameFilter('');
    setRoleFilter('');
    setFilteredUsers(users);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (userId: number) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setUsers(users.filter(u => u.USER_ID !== userId));
          setFilteredUsers(filteredUsers.filter(u => u.USER_ID !== userId));
          alert('تم حذف المستخدم بنجاح');
        } else {
          alert('فشل في حذف المستخدم');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('حدث خطأ أثناء حذف المستخدم');
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.USER_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: selectedUser.USERNAME,
          email: selectedUser.EMAIL,
          fullName: selectedUser.FULL_NAME,
          roleId: selectedUser.ROLE_ID,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // Use the updated user data from the API response
        const updatedUser = responseData.user;
        
        // Update local state with the fresh data from server
        const updatedUsers = users.map(u => 
          u.USER_ID === selectedUser.USER_ID ? updatedUser : u
        );
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
        
        // Update selectedUser to show updated permissions in modal
        setSelectedUser(updatedUser);
        
        setIsEditModalOpen(false);
        alert('تم تحديث المستخدم بنجاح');
      } else {
        alert('فشل في تحديث المستخدم');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('حدث خطأ أثناء تحديث المستخدم');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">إدارة المستخدمين</h1>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المستخدم
              </label>
              <input
                type="text"
                value={usernameFilter}
                onChange={(e) => setUsernameFilter(e.target.value)}
                placeholder="ابحث باسم المستخدم..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الدور الوظيفي
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">كل الأدوار</option>
                {roles.map(role => (
                  <option key={role.ROLE_ID} value={role.NAME}>
                    {role.NAME}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={handleSearch}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Search size={20} />
                بحث
              </button>
              <button
                onClick={handleResetSearch}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw size={20} />
                إعادة تعيين
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">ID</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">اسم المستخدم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">الاسم الكامل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">الدور</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">الصلاحيات</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">جاري التحميل...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      لا توجد بيانات للمستخدمين
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                  <tr key={user.USER_ID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{user.USER_ID}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.USERNAME}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.FULL_NAME}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {user.ROLE_NAME}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="space-y-1">
                        {user.PERMISSIONS.slice(0, 2).map((perm, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-medium">{perm.SUBJECT}</span> - {perm.ACTION}
                            {perm.FIELD_NAME && ` (${perm.FIELD_NAME})`}
                            <span className={`ml-2 ${perm.CAN_ACCESS ? 'text-green-600' : 'text-red-600'}`}>
                              {perm.CAN_ACCESS ? '✓' : '✗'}
                            </span>
                          </div>
                        ))}
                        {user.PERMISSIONS.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{user.PERMISSIONS.length - 2} المزيد...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.USER_ID)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">تعديل المستخدم</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    معرف المستخدم
                  </label>
                  <input
                    type="text"
                    value={selectedUser.USER_ID}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المستخدم
                  </label>
                  <input
                    type="text"
                    value={selectedUser.USERNAME}
                    onChange={(e) => setSelectedUser({...selectedUser, USERNAME: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={selectedUser.FULL_NAME}
                    onChange={(e) => setSelectedUser({...selectedUser, FULL_NAME: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الدور الوظيفي
                  </label>
                  <select
                    value={selectedUser.ROLE_ID}
                    onChange={(e) => {
                      const roleId = parseInt(e.target.value);
                      const roleName = roles.find(r => r.ROLE_ID === roleId)?.NAME || '';
                      setSelectedUser({...selectedUser, ROLE_ID: roleId, ROLE_NAME: roleName});
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {roles.map(role => (
                      <option key={role.ROLE_ID} value={role.ROLE_ID}>
                        {role.NAME}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={selectedUser.EMAIL}
                    onChange={(e) => setSelectedUser({...selectedUser, EMAIL: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الصلاحيات
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {selectedUser.PERMISSIONS.map((perm, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="text-sm">
                          <span className="font-medium">{perm.SUBJECT}</span> - {perm.ACTION}
                          {perm.FIELD_NAME && <span className="text-gray-600"> ({perm.FIELD_NAME})</span>}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${perm.CAN_ACCESS ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {perm.CAN_ACCESS ? 'مسموح' : 'غير مسموح'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    حفظ التغييرات
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
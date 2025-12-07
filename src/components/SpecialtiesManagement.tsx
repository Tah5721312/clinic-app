'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Stethoscope, Save, XCircle } from 'lucide-react';
import { DOMAIN } from '@/lib/constants';
import { toast } from 'react-toastify';

interface Specialty {
  SPECIALTY_ID: number;
  NAME: string;
  DESCRIPTION?: string;
}

interface SpecialtiesManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SpecialtiesManagement({ isOpen, onClose }: SpecialtiesManagementProps) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isAdding, setIsAdding] = useState(false);

  // Fetch specialties
  const fetchSpecialties = async () => {
    setLoading(true);
    try {
      // Fetch all specialties including inactive ones
      const response = await fetch(`${DOMAIN}/api/specialties/all?activeOnly=false`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fetched specialties from database:', data);
        setSpecialties(data);
      } else {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        toast.error(errorData.error || 'فشل في جلب التخصصات من قاعدة البيانات');
        // Fallback: try to get from regular endpoint and transform
        const fallbackResponse = await fetch(`${DOMAIN}/api/specialties`);
        if (fallbackResponse.ok) {
          const names = await fallbackResponse.json();
          console.warn('⚠️ Using fallback endpoint - table may not exist');
          // Transform to full objects
          const transformed = names.map((name: string, index: number) => ({
            SPECIALTY_ID: index + 1,
            NAME: name,
            DESCRIPTION: '',
          }));
          setSpecialties(transformed);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching specialties:', error);
      toast.error('فشل في جلب التخصصات. تأكد من إنشاء جدول SPECIALTIES في قاعدة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSpecialties();
    }
  }, [isOpen]);

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      toast.error('اسم التخصص مطلوب');
      return;
    }

    setLoading(true);
    try {
      console.log('➕ Adding specialty:', formData.name);
      const response = await fetch(`${DOMAIN}/api/specialties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        }),
      });

      const responseData = await response.json();
      console.log('📥 Response:', response.status, responseData);

      if (response.ok) {
        toast.success('تم إضافة التخصص بنجاح في قاعدة البيانات');
        setFormData({ name: '', description: '' });
        setIsAdding(false);
        // Wait a bit before refetching to ensure database is updated
        setTimeout(() => {
          fetchSpecialties();
        }, 500);
      } else {
        console.error('❌ Error adding specialty:', responseData);
        toast.error(responseData.error || responseData.details || 'فشل في إضافة التخصص');
      }
    } catch (error) {
      console.error('❌ Exception adding specialty:', error);
      toast.error('فشل في إضافة التخصص');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (specialty: Specialty) => {
    setEditingId(specialty.SPECIALTY_ID);
    setFormData({
      name: specialty.NAME,
      description: specialty.DESCRIPTION || '',
    });
    setIsAdding(false);
  };

  const handleUpdate = async (id: number) => {
    if (!formData.name.trim()) {
      toast.error('اسم التخصص مطلوب');
      return;
    }

    setLoading(true);
    try {
      console.log('✏️ Updating specialty ID:', id, 'with data:', formData);
      const response = await fetch(`${DOMAIN}/api/specialties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        }),
      });

      const responseData = await response.json();
      console.log('📥 Update response:', response.status, responseData);

      if (response.ok) {
        toast.success('تم تحديث التخصص بنجاح في قاعدة البيانات');
        setEditingId(null);
        setFormData({ name: '', description: '' });
        // Wait a bit before refetching to ensure database is updated
        setTimeout(() => {
          fetchSpecialties();
        }, 500);
      } else {
        console.error('❌ Error updating specialty:', responseData);
        toast.error(responseData.error || responseData.details || 'فشل في تحديث التخصص');
      }
    } catch (error) {
      console.error('❌ Exception updating specialty:', error);
      toast.error('فشل في تحديث التخصص');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا التخصص؟')) {
      return;
    }

    setLoading(true);
    try {
      console.log('🗑️ Deleting specialty ID:', id);
      const response = await fetch(`${DOMAIN}/api/specialties/${id}`, {
        method: 'DELETE',
      });

      const responseData = await response.json();
      console.log('📥 Delete response:', response.status, responseData);

      if (response.ok) {
        toast.success('تم حذف التخصص بنجاح من قاعدة البيانات');
        // Wait a bit before refetching to ensure database is updated
        setTimeout(() => {
          fetchSpecialties();
        }, 500);
      } else {
        console.error('❌ Error deleting specialty:', responseData);
        toast.error(responseData.error || responseData.details || 'فشل في حذف التخصص');
      }
    } catch (error) {
      console.error('❌ Exception deleting specialty:', error);
      toast.error('فشل في حذف التخصص');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: '', description: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Stethoscope className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold">إدارة التخصصات</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add/Edit Form */}
          {(isAdding || editingId) && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold mb-4">
                {editingId ? 'تعديل التخصص' : 'إضافة تخصص جديد'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم التخصص *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="أدخل اسم التخصص"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الوصف
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="أدخل وصف التخصص (اختياري)"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editingId ? handleUpdate(editingId) : handleAdd()}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? 'حفظ التعديلات' : 'إضافة'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Button */}
          {!isAdding && !editingId && (
            <button
              onClick={() => {
                setIsAdding(true);
                setEditingId(null);
                setFormData({ name: '', description: '' });
              }}
              className="mb-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              إضافة تخصص جديد
            </button>
          )}

          {/* Specialties List */}
          {loading && specialties.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">جاري تحميل التخصصات...</p>
            </div>
          ) : specialties.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Stethoscope className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="font-medium mb-2">لا توجد تخصصات في قاعدة البيانات</p>
              <p className="text-sm text-gray-400">
                تأكد من إنشاء جدول SPECIALTIES في قاعدة البيانات أولاً
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {specialties.map((specialty) => (
                <div
                  key={specialty.SPECIALTY_ID}
                  className={`p-4 border rounded-lg ${
                    editingId === specialty.SPECIALTY_ID
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {editingId === specialty.SPECIALTY_ID ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(specialty.SPECIALTY_ID)}
                          disabled={loading}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          حفظ
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={loading}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{specialty.NAME}</h3>
                        {specialty.DESCRIPTION && (
                          <p className="text-sm text-gray-600 mt-1">{specialty.DESCRIPTION}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(specialty)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="تعديل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(specialty.SPECIALTY_ID)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}


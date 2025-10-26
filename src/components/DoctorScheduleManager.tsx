'use client';

import { useState, useEffect } from 'react';
import { DoctorSchedule, CreateScheduleDto, UpdateScheduleDto } from '@/lib/types';
import { Plus, Edit, Trash2, Clock, Calendar, Save, X } from 'lucide-react';
import { Can } from '@/components/Can';
import { DOMAIN } from '@/lib/constants';

interface DoctorScheduleManagerProps {
  doctorId: number;
  doctorName: string;
  canEdit?: boolean;
}

interface ScheduleFormData {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_available: number;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'الأحد' },
  { value: 2, label: 'الاثنين' },
  { value: 3, label: 'الثلاثاء' },
  { value: 4, label: 'الأربعاء' },
  { value: 5, label: 'الخميس' },
  { value: 6, label: 'الجمعة' },
  { value: 7, label: 'السبت' }
];

const SLOT_DURATION_OPTIONS = [
  { value: 15, label: '15 دقيقة' },
  { value: 30, label: '30 دقيقة' },
  { value: 45, label: '45 دقيقة' },
  { value: 60, label: '60 دقيقة' }
];

export default function DoctorScheduleManager({ doctorId, doctorName, canEdit = true }: DoctorScheduleManagerProps) {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<number | null>(null);
  const [formData, setFormData] = useState<ScheduleFormData>({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    slot_duration: 30,
    is_available: 1
  });

  useEffect(() => {
    fetchSchedules();
  }, [doctorId]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${DOMAIN}/api/doctors/${doctorId}/schedule`);
      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }
      const data = await response.json();
      setSchedules(data);
    } catch (err) {
      setError('حدث خطأ أثناء جلب الجدول الزمني');
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (editingSchedule) {
        // Update existing schedule
        console.log('Updating schedule:', editingSchedule, 'with data:', formData);
        const response = await fetch(`${DOMAIN}/api/doctors/${doctorId}/schedule/${editingSchedule}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Update failed:', response.status, errorData);
          throw new Error(errorData.error || 'Failed to update schedule');
        }

        const result = await response.json();
        console.log('Update successful:', result);

        // Update local state
        setSchedules(prev => prev.map(schedule => 
          schedule.SCHEDULE_ID === editingSchedule 
            ? { 
                ...schedule, 
                DAY_OF_WEEK: formData.day_of_week,
                START_TIME: formData.start_time,
                END_TIME: formData.end_time,
                SLOT_DURATION: formData.slot_duration,
                IS_AVAILABLE: formData.is_available,
                DAY_NAME_AR: DAYS_OF_WEEK.find(d => d.value === formData.day_of_week)?.label,
                UPDATED_AT: new Date()
              }
            : schedule
        ));
        
        setEditingSchedule(null);
        setShowAddForm(false);
        setSuccess('تم تحديث الجدول الزمني بنجاح');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        // Create new schedule
        const response = await fetch(`${DOMAIN}/api/doctors/${doctorId}/schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            doctor_id: doctorId
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create schedule');
        }

        const result = await response.json();
        
        // Add to local state
        const newSchedule: DoctorSchedule = {
          SCHEDULE_ID: result.scheduleId,
          DOCTOR_ID: doctorId,
          DOCTOR_NAME: doctorName,
          DAY_OF_WEEK: formData.day_of_week,
          DAY_NAME_AR: DAYS_OF_WEEK.find(d => d.value === formData.day_of_week)?.label,
          START_TIME: formData.start_time,
          END_TIME: formData.end_time,
          SLOT_DURATION: formData.slot_duration,
          IS_AVAILABLE: formData.is_available,
          CREATED_AT: new Date(),
          UPDATED_AT: new Date()
        };
        
        setSchedules(prev => [...prev, newSchedule]);
        setShowAddForm(false);
        setSuccess('تم إضافة الجدول الزمني بنجاح');
        setTimeout(() => setSuccess(''), 3000);
      }

      // Reset form
      setFormData({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
        slot_duration: 30,
        is_available: 1
      });
      
    } catch (err) {
      setError('حدث خطأ أثناء حفظ الجدول الزمني');
      console.error('Error saving schedule:', err);
    }
  };

  const handleEdit = (schedule: DoctorSchedule) => {
    console.log('Editing schedule:', schedule);
    setError('');
    setSuccess('');
    setEditingSchedule(schedule.SCHEDULE_ID);
    setFormData({
      day_of_week: schedule.DAY_OF_WEEK,
      start_time: schedule.START_TIME,
      end_time: schedule.END_TIME,
      slot_duration: schedule.SLOT_DURATION,
      is_available: schedule.IS_AVAILABLE
    });
    setShowAddForm(true);
  };

  const handleDelete = async (scheduleId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الجدول الزمني؟')) return;

    try {
      const response = await fetch(`${DOMAIN}/api/doctors/${doctorId}/schedule/${scheduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete schedule');
      }

      // Remove from local state
      setSchedules(prev => prev.filter(schedule => schedule.SCHEDULE_ID !== scheduleId));
      
    } catch (err) {
      setError('حدث خطأ أثناء حذف الجدول الزمني');
      console.error('Error deleting schedule:', err);
    }
  };

  const handleCancel = () => {
    setError('');
    setSuccess('');
    setShowAddForm(false);
    setEditingSchedule(null);
    setFormData({
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      slot_duration: 30,
      is_available: 1
    });
  };

  const getDaySchedules = (dayOfWeek: number) => {
    return schedules.filter(schedule => schedule.DAY_OF_WEEK === dayOfWeek);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">جاري تحميل الجدول الزمني...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 ">
      {/* Header */}
      <div className="flex justify-between items-center ">
        <h3 className="card-title text-xl font-bold">إدارة الجدول الزمني - {doctorName}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setError('');
              setSuccess('');
              fetchSchedules();
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
            title="تحديث"
          >
            <Clock className="w-4 h-4" />
            تحديث
          </button>
          {canEdit && (

          // <Can do="update" on="Doctor">
            <button
              onClick={() => {
                setError('');
                setSuccess('');
                setEditingSchedule(null);
                setShowAddForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة جدول زمني
            </button>

          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && canEdit && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">
            {editingSchedule ? 'تعديل الجدول الزمني' : 'إضافة جدول زمني جديد'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">اليوم</label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData(prev => ({ ...prev, day_of_week: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">مدة الموعد</label>
                <select
                  value={formData.slot_duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, slot_duration: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {SLOT_DURATION_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">وقت البداية</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">وقت النهاية</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_available === 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked ? 1 : 0 }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">متاح للحجز</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingSchedule ? 'تحديث' : 'إضافة'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule Display */}
      <div className="space-y-4">
        {DAYS_OF_WEEK.map(day => {
          const daySchedules = getDaySchedules(day.value);
          
          return (
            <div key={day.value} className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="card-title text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {day.label}
              </h4>
              
              {daySchedules.length === 0 ? (
                <p className="text-gray-500 text-sm">لا يوجد جدول زمني لهذا اليوم</p>
              ) : (
                <div className="space-y-2">
                  {daySchedules.map(schedule => (
                    <div
                      key={schedule.SCHEDULE_ID}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        schedule.IS_AVAILABLE === 1 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="card-title flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">
                            {schedule.START_TIME} - {schedule.END_TIME}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          مدة الموعد: {schedule.SLOT_DURATION} دقيقة
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          schedule.IS_AVAILABLE === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {schedule.IS_AVAILABLE === 1 ? 'متاح' : 'غير متاح'}
                        </span>
                      </div>
                      
                      {canEdit && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.SCHEDULE_ID)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {schedules.length === 0 && !showAddForm && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد جدول زمني</h3>
          <p className="text-gray-500 mb-4">ابدأ بإضافة جدول زمني للطبيب</p>
          {canEdit && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              إضافة جدول زمني
            </button>
          )}
        </div>
      )}
    </div>
  );
}

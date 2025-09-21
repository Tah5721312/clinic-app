'use client';

import { Calendar, Clock, FileText, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Doctor, Patient } from '@/lib/types';

import Button from '@/components/buttons/Button';

interface AppointmentFormProps {
  doctorId?: string;
  patientId?: string;
  onSuccess?: () => void;
}

interface FormData {
  patient_id: number;
  doctor_id: number;
  schedule: string;
  reason: string;
  note?: string;
}

export default function AppointmentForm({
  doctorId,
  patientId,
  onSuccess,
}: AppointmentFormProps) {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    patient_id: patientId ? parseInt(patientId) : 0,
    doctor_id: doctorId ? parseInt(doctorId) : 0,
    schedule: '',
    reason: '',
    note: '',
  });

  // Update form data when props change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      patient_id: patientId ? parseInt(patientId) : prev.patient_id,
      doctor_id: doctorId ? parseInt(doctorId) : prev.doctor_id,
    }));
  }, [doctorId, patientId]);

  useEffect(() => {
    // Fetch doctors and patients for dropdowns
    const fetchData = async () => {
      try {
        const [doctorsRes, patientsRes] = await Promise.all([
          fetch('/api/doctors'),
          fetch('/api/patients'),
        ]);

        if (doctorsRes.ok) {
          const doctorsData = await doctorsRes.json();
          setDoctors(doctorsData);
        }

        if (patientsRes.ok) {
          const patientsData = await patientsRes.json();
          setPatients(patientsData);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'patient_id' || name === 'doctor_id'
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (
        !formData.patient_id ||
        !formData.doctor_id ||
        !formData.schedule ||
        !formData.reason
      ) {
        throw new Error('Please fill in all required fields');
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create appointment');
      }

      const _result = await response.json();

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/appointments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-2xl mx-auto'>
      <div className='bg-white rounded-lg shadow-lg p-6'>
        <div className='flex items-center mb-6'>
          <Calendar className='w-6 h-6 text-blue-600 mr-2' />
          <h2 className='text-2xl font-bold text-gray-900'>
            Book New Appointment
          </h2>
        </div>

        {error && (
          <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Patient Selection */}
          <div>
            <label
              htmlFor='patient_id'
              className='flex items-center text-sm font-medium text-gray-700 mb-2'
            >
              <User className='w-4 h-4 mr-2' />
              Patient *
            </label>
            <select
              id='patient_id'
              name='patient_id'
              value={formData.patient_id}
              onChange={handleInputChange}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value={0}>Select a patient</option>
              {patients.map((patient, index) => (
                <option
                  key={patient.PATIENT_ID || `patient-${index}`}
                  value={patient.PATIENT_ID}
                >
                  {patient.NAME} ({patient.EMAIL})
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Selection */}
          <div>
            <label
              htmlFor='doctor_id'
              className='flex items-center text-sm font-medium text-gray-700 mb-2'
            >
              <User className='w-4 h-4 mr-2' />
              Doctor *
            </label>
            <select
              id='doctor_id'
              name='doctor_id'
              value={formData.doctor_id}
              onChange={handleInputChange}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value={0}>Select a doctor</option>
              {doctors.map((doctor, index) => (
                <option
                  key={doctor.DOCTOR_ID || `doctor-${index}`}
                  value={doctor.DOCTOR_ID}
                >
                  Dr. {doctor.NAME} - {doctor.SPECIALTY}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div>
            <label
              htmlFor='schedule'
              className='flex items-center text-sm font-medium text-gray-700 mb-2'
            >
              <Clock className='w-4 h-4 mr-2' />
              Date & Time *
            </label>
            <input
              type='datetime-local'
              id='schedule'
              name='schedule'
              value={formData.schedule}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().slice(0, 16)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          {/* Reason */}
          <div>
            <label
              htmlFor='reason'
              className='flex items-center text-sm font-medium text-gray-700 mb-2'
            >
              <FileText className='w-4 h-4 mr-2' />
              Reason for Visit *
            </label>
            <input
              type='text'
              id='reason'
              name='reason'
              value={formData.reason}
              onChange={handleInputChange}
              required
              placeholder='e.g., Regular checkup, consultation, follow-up'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor='note'
              className='flex items-center text-sm font-medium text-gray-700 mb-2'
            >
              <FileText className='w-4 h-4 mr-2' />
              Additional Notes
            </label>
            <textarea
              id='note'
              name='note'
              value={formData.note}
              onChange={handleInputChange}
              rows={3}
              placeholder='Any additional information or special requests...'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
            />
          </div>

          {/* Submit Button */}
          <div className='flex justify-end space-x-3 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='primary'
              isLoading={loading}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Book Appointment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

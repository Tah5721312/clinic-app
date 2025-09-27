'use client';

import { Calendar, Clock, FileText, User, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Doctor, Patient } from '@/lib/types';

import Button from '@/components/buttons/Button';
import { DOMAIN } from '@/lib/constants';

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
  
  // Custom dropdown states
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

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

  // Set selected doctor when doctorId prop changes or doctors are loaded
  useEffect(() => {
    if (doctors.length > 0 && formData.doctor_id) {
      const doctor = doctors.find(d => d.DOCTOR_ID === formData.doctor_id);
      if (doctor) {
        setSelectedDoctor(doctor);
      }
    }
  }, [doctors, formData.doctor_id]);

  useEffect(() => {
    // Fetch doctors and patients for dropdowns
    const fetchData = async () => {
      try {
        const [doctorsRes, patientsRes] = await Promise.all([
          fetch(`${DOMAIN}/api/doctors`),
          fetch(`${DOMAIN}/api/patients`),
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

  const handleDoctorSelect = (doctor: Doctor | null) => {
    setSelectedDoctor(doctor);
    setFormData(prev => ({
      ...prev,
      doctor_id: doctor ? doctor.DOCTOR_ID : 0
    }));
    setIsDoctorDropdownOpen(false);
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

      const response = await fetch(`${DOMAIN}/api/appointments`, {
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500 text-white',
      'bg-blue-500 text-white',
      'bg-green-500 text-white',
      'bg-purple-500 text-white',
      'bg-orange-500 text-white',
      'bg-teal-500 text-white',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
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

          {/* Doctor Selection - Custom Dropdown */}
          <div className="relative">
            <label
              htmlFor='doctor_id'
              className='flex items-center text-sm font-medium text-gray-700 mb-2'>
              <User className='w-4 h-4 mr-2' />
              Doctor *
            </label>
            
            {/* Custom Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-left flex items-center justify-between"
              >
                <div className="flex items-center">
                  {selectedDoctor ? (
                    <>
                      {/* Doctor Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getAvatarColor(selectedDoctor.NAME)} shadow-sm mr-3`}>
                        {selectedDoctor.IMAGE ? (
                          <img 
                            src={selectedDoctor.IMAGE} 
                            alt={selectedDoctor.NAME}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(selectedDoctor.NAME)
                        )}
                      </div>
                      <span> {selectedDoctor.NAME} - {selectedDoctor.SPECIALTY}</span>
                    </>
                  ) : (
                    <span className="text-gray-500">Select a doctor</span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDoctorDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Options */}
              {isDoctorDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  <div
                    onClick={() => handleDoctorSelect(null)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="text-gray-500">Select a doctor</span>
                  </div>
                  
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.DOCTOR_ID}
                      onClick={() => handleDoctorSelect(doctor)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    >
                      {/* Doctor Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getAvatarColor(doctor.NAME)} shadow-sm mr-3`}>
                        {doctor.IMAGE ? (
                          <img 
                            src={doctor.IMAGE} 
                            alt={doctor.NAME}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(doctor.NAME)
                        )}
                      </div>
                      <div>
                        <div className="font-medium">Dr. {doctor.NAME}</div>
                        <div className="text-sm text-gray-500">{doctor.SPECIALTY}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hidden input for form submission */}
            <input
              type="hidden"
              name="doctor_id"
              value={selectedDoctor?.DOCTOR_ID || ''}
            />
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
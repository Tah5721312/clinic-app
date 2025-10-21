'use client';

import { Calendar, Clock, FileText, User, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Doctor, Patient } from '@/lib/types';
import { useDoctors, useSpecialties } from '@/hooks/useApiData';

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
  appointment_type: string;
  payment_status: string;
  payment_amount: number;
  payment_method: string;
}

export default function AppointmentForm({
  doctorId,
  patientId,
  onSuccess,
}: AppointmentFormProps) {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Specialty and doctor filtering
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  
  // Fetch specialties and doctors
  const { data: specialties, loading: specialtiesLoading, error: specialtiesError } = useSpecialties();
  const { data: doctors } = useDoctors(selectedSpecialty || undefined);
  
  // Custom dropdown states
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [formData, setFormData] = useState<FormData>({
    patient_id: patientId ? parseInt(patientId) : 0,
    doctor_id: doctorId ? parseInt(doctorId) : 0,
    schedule: '',
    reason: '',
    note: '',
    appointment_type: 'consultation',
    payment_status: 'unpaid',
    payment_amount: 0,
    payment_method: '',
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
    if (doctors && doctors.length > 0 && formData.doctor_id) {
      const doctor = doctors.find(d => d.DOCTOR_ID === formData.doctor_id);
      if (doctor) {
        setSelectedDoctor(doctor);
      }
    }
  }, [doctors, formData.doctor_id]);

  useEffect(() => {
    // Fetch patients for dropdown
    const fetchPatients = async () => {
      try {
        const patientsRes = await fetch(`${DOMAIN}/api/patients`);
        if (patientsRes.ok) {
          const patientsData = await patientsRes.json();
          setPatients(patientsData);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching patients:', err);
      }
    };

    fetchPatients();
  }, []);

  // Handle specialty change
  const handleSpecialtyChange = (specialty: string) => {
    setSelectedSpecialty(specialty);
    setSelectedDoctor(null); // Reset doctor selection when specialty changes
    setFormData(prev => ({ ...prev, doctor_id: 0 }));
  };

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
          : name === 'payment_amount'
          ? parseFloat(value) || 0
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
    setSuccess(false);

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

      // Validate specialty and doctor selection
      if (!selectedSpecialty) {
        throw new Error('Please select a doctor specialty');
      }

      if (!selectedDoctor) {
        throw new Error('Please select a doctor');
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
      setSuccess(true);

      // Reset form after successful submission
      setFormData({
        patient_id: patientId ? parseInt(patientId) : 0,
        doctor_id: doctorId ? parseInt(doctorId) : 0,
        schedule: '',
        reason: '',
        note: '',
        appointment_type: 'consultation',
        payment_status: 'unpaid',
        payment_amount: 0,
        payment_method: '',
      });
      setSelectedSpecialty('');
      setSelectedDoctor(null);

      // Redirect after a short delay to show success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/appointments');
        }
      }, 1500);
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

        {success && (
          <div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6'>
            <div className='flex items-center'>
              <div className='w-5 h-5 mr-2'>
                <svg className='w-full h-full' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                </svg>
              </div>
              <div>
                <p className='font-bold'>Appointment Created Successfully!</p>
                <p className='text-sm'>Redirecting to appointments page...</p>
              </div>
            </div>
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

          {/* Specialty Selection */}
          <div>
            <label
              htmlFor='specialty'
              className='flex items-center text-sm font-medium text-gray-700 mb-2'
            >
              <User className='w-4 h-4 mr-2' />
              Doctor Specialty *
            </label>
            <select
              id='specialty'
              value={selectedSpecialty}
              onChange={(e) => handleSpecialtyChange(e.target.value)}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value=''>Select a specialty</option>
              {specialtiesLoading ? (
                <option disabled>Loading specialties...</option>
              ) : specialtiesError ? (
                <option disabled>Error loading specialties</option>
              ) : specialties && specialties.length > 0 ? (
                specialties.map((spec, index) => (
                  <option key={spec || `specialty-${index}`} value={spec}>
                    {spec}
                  </option>
                ))
              ) : (
                <option disabled>No specialties available</option>
              )}
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
                disabled={!selectedSpecialty}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-left flex items-center justify-between disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    <span className="text-gray-500">
                      {!selectedSpecialty ? 'Please select a specialty first' : 'Select a doctor'}
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDoctorDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Options */}
              {isDoctorDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {!selectedSpecialty ? (
                    <div className="px-3 py-2 text-gray-500 text-center">
                      Please select a specialty first
                    </div>
                  ) : doctors && doctors.length > 0 ? (
                    <>
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
                    </>
                  ) : (
                    <div className="px-3 py-2 text-gray-500 text-center">
                      No doctors available in this specialty
                    </div>
                  )}
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

          {/* Appointment Type */}
          <div>
            <label
              htmlFor='appointment_type'
              className='flex items-center text-sm font-medium text-gray-700 mb-2'
            >
              <FileText className='w-4 h-4 mr-2' />
              Appointment Type *
            </label>
            <select
              id='appointment_type'
              name='appointment_type'
              value={formData.appointment_type}
              onChange={handleInputChange}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value='consultation'>Consultation</option>
              <option value='follow_up'>Follow-up</option>
              <option value='emergency'>Emergency</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label
              htmlFor='payment_status'
              className='flex items-center text-sm font-medium text-gray-700 mb-2'
            >
              <FileText className='w-4 h-4 mr-2' />
              Payment Status *
            </label>
            <select
              id='payment_status'
              name='payment_status'
              value={formData.payment_status}
              onChange={handleInputChange}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value='unpaid'>Unpaid</option>
              <option value='partial'>Partial</option>
              <option value='paid'>Paid</option>
              <option value='refunded'>Refunded</option>
            </select>
          </div>

          {/* Payment Amount */}
          <div>
            <label
              htmlFor='payment_amount'
              className='flex items-center text-sm font-medium text-gray-700 mb-2'
            >
              <FileText className='w-4 h-4 mr-2' />
              Payment Amount (EGP)
            </label>
            <input
              type='number'
              id='payment_amount'
              name='payment_amount'
              value={formData.payment_amount}
              onChange={handleInputChange}
              min='0'
              step='0.01'
              placeholder='0.00'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          {/* Payment Method */}
          <div>
            <label
              htmlFor='payment_method'
              className='flex items-center text-sm font-medium text-gray-700 mb-2'
            >
              <FileText className='w-4 h-4 mr-2' />
              Payment Method
            </label>
            <select
              id='payment_method'
              name='payment_method'
              value={formData.payment_method}
              onChange={handleInputChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value=''>Select payment method</option>
              <option value='cash'>Cash</option>
              <option value='card'>Credit/Debit Card</option>
              <option value='bank_transfer'>Bank Transfer</option>
              <option value='insurance'>Insurance</option>
              <option value='other'>Other</option>
            </select>
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
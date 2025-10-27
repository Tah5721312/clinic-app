'use client';

import { Receipt, User, Calendar, DollarSign, FileText, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Patient, Appointment, CreateInvoiceDto } from '@/lib/types';
import { useDoctors, useSpecialties } from '@/hooks/useApiData';

import Button from '@/components/buttons/Button';
import { DOMAIN } from '@/lib/constants';

interface InvoiceFormProps {
  patientId?: string;
  appointmentId?: string;
  onSuccess?: () => void;
  onCancel: () => void; // ← هذا إلزامي لأنك تمرره
  editData?: CreateInvoiceDto & { invoice_id?: number };
}

interface FormData {
  patient_id: number;
  appointment_id?: number;
  amount: number;
  discount: number;
  notes?: string;
  payment_method?: string;
  paid_amount: number;
}

export default function InvoiceForm({
  patientId,
  appointmentId,
  onSuccess,
  editData,
}: InvoiceFormProps) {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Specialty and doctor filtering for appointments
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const { data: specialties } = useSpecialties();
  const { data: doctors } = useDoctors(selectedSpecialty || undefined);
  
  // Custom dropdown states
  const [isAppointmentDropdownOpen, setIsAppointmentDropdownOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const [formData, setFormData] = useState<FormData>({
    patient_id: patientId ? parseInt(patientId) : 0,
    appointment_id: appointmentId ? parseInt(appointmentId) : undefined,
    amount: 0,
    discount: 0,
    notes: '',
    payment_method: '',
    paid_amount: 0,
  });

  // Update form data when props change or edit data is provided
  useEffect(() => {
    if (editData) {
      setFormData({
        patient_id: editData.patient_id,
        appointment_id: editData.appointment_id,
        amount: editData.amount,
        discount: editData.discount || 0,
        notes: editData.notes || '',
        payment_method: editData.payment_method || '',
        paid_amount: editData.paid_amount || 0,
      });
    } else {
      setFormData(prev => ({
        ...prev,
        patient_id: patientId ? parseInt(patientId) : prev.patient_id,
        appointment_id: appointmentId ? parseInt(appointmentId) : prev.appointment_id,
      }));
    }
  }, [patientId, appointmentId, editData]);

  // Set selected appointment when appointmentId prop changes
  useEffect(() => {
    if (appointments && appointments.length > 0 && formData.appointment_id) {
      const appointment = appointments.find(a => a.APPOINTMENT_ID === formData.appointment_id);
      if (appointment) {
        setSelectedAppointment(appointment);
        // Also set the amount if it's not already set
        if (formData.amount === 0) {
          // Determine the correct fee based on appointment type
          const fee = appointment.APPOINTMENT_TYPE === 'follow_up' 
            ? (appointment.FOLLOW_UP_FEE || 0)
            : (appointment.CONSULTATION_FEE || 0);
          
          setFormData(prev => ({
            ...prev,
            amount: fee,
            // Auto-populate payment data from appointment
            paid_amount: appointment.PAYMENT_AMOUNT || 0,
            payment_method: appointment.PAYMENT_METHOD || ''
          }));
        }
      }
    }
  }, [appointments, formData.appointment_id, formData.amount]);

  useEffect(() => {
    // Fetch patients for dropdown
    const fetchPatients = async () => {
      try {
        const patientsRes = await fetch(`${DOMAIN}/api/patients`);
        if (patientsRes.ok) {
          const patientsData = await patientsRes.json();
          setPatients(patientsData);
          
          // If patientId is provided, ensure the patient is selected
          if (patientId && patientsData.length > 0) {
            const patientExists = patientsData.find((p: Patient) => p.PATIENT_ID === parseInt(patientId));
            if (patientExists && formData.patient_id === 0) {
              setFormData(prev => ({
                ...prev,
                patient_id: parseInt(patientId)
              }));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    };

    fetchPatients();
  }, [patientId]);

  // Fetch appointments when patient is selected
  useEffect(() => {
    if (formData.patient_id) {
      const fetchAppointments = async () => {
        try {
          const appointmentsRes = await fetch(`${DOMAIN}/api/appointments?patient_id=${formData.patient_id}`);
          if (appointmentsRes.ok) {
            const appointmentsData = await appointmentsRes.json();
            // Filter appointments to only show those for the selected patient
            const filteredAppointments = appointmentsData.filter((appointment: any) => 
              appointment.PATIENT_ID === formData.patient_id
            );
            setAppointments(filteredAppointments);
            
            // If appointmentId is provided, auto-select the appointment
            if (appointmentId && filteredAppointments.length > 0) {
              const appointment = filteredAppointments.find((a: Appointment) => a.APPOINTMENT_ID === parseInt(appointmentId));
              if (appointment) {
                // Determine the correct fee based on appointment type
                const fee = appointment.APPOINTMENT_TYPE === 'follow_up' 
                  ? (appointment.FOLLOW_UP_FEE || 0)
                  : (appointment.CONSULTATION_FEE || 0);
                
                setSelectedAppointment(appointment);
                setFormData(prev => ({
                  ...prev,
                  appointment_id: parseInt(appointmentId),
                  amount: fee,
                  paid_amount: appointment.PAYMENT_AMOUNT || 0,
                  payment_method: appointment.PAYMENT_METHOD || ''
                }));
              }
            }
          }
        } catch (err) {
          console.error('Error fetching appointments:', err);
        }
      };

      fetchAppointments();
    } else {
      // Clear appointments when no patient is selected
      setAppointments([]);
      setSelectedAppointment(null);
    }
  }, [formData.patient_id, appointmentId]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'patient_id' || name === 'appointment_id'
          ? parseInt(value) || 0
          : name === 'amount' || name === 'discount' || name === 'paid_amount'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleAppointmentSelect = (appointment: Appointment | null) => {
    setSelectedAppointment(appointment);
    
    // Determine the correct fee based on appointment type
    const fee = appointment?.APPOINTMENT_TYPE === 'follow_up' 
      ? (appointment?.FOLLOW_UP_FEE || 0)
      : (appointment?.CONSULTATION_FEE || 0);
    
    setFormData(prev => ({
      ...prev,
      appointment_id: appointment ? appointment.APPOINTMENT_ID : undefined,
      // Automatically populate amount with the appropriate fee based on appointment type
      amount: fee,
      // Automatically populate paid_amount with payment_amount from appointment
      paid_amount: appointment?.PAYMENT_AMOUNT || 0,
      // Automatically populate payment_method from appointment
      payment_method: appointment?.PAYMENT_METHOD || ''
    }));
    setIsAppointmentDropdownOpen(false);
  };

  const calculateTotal = () => {
    return Math.max(0, formData.amount - formData.discount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      if (!formData.patient_id || formData.amount <= 0) {
        throw new Error('Please fill in all required fields');
      }

      // Validate paid amount doesn't exceed total
      const total = calculateTotal();
      if (formData.paid_amount > total) {
        throw new Error('Paid amount cannot exceed total amount');
      }

      const invoiceData: CreateInvoiceDto = {
        patient_id: formData.patient_id,
        appointment_id: formData.appointment_id || undefined,
        amount: formData.amount,
        discount: formData.discount,
        notes: formData.notes || undefined,
        payment_method: formData.payment_method || undefined,
        paid_amount: formData.paid_amount,
      };

      const url = editData?.invoice_id 
        ? `${DOMAIN}/api/invoices/${editData.invoice_id}`
        : `${DOMAIN}/api/invoices`;
      
      const method = editData?.invoice_id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editData?.invoice_id ? 'update' : 'create'} invoice`);
      }

      const result = await response.json();
      setSuccess(true);

      // Reset form after successful submission
      if (!editData) {
        setFormData({
          patient_id: patientId ? parseInt(patientId) : 0,
          appointment_id: appointmentId ? parseInt(appointmentId) : undefined,
          amount: 0,
          discount: 0,
          notes: '',
          payment_method: '',
          paid_amount: 0,
        });
        setSelectedAppointment(null);
      }

      // Redirect after a short delay to show success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/invoices');
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
      <div className='card rounded-lg shadow-lg p-6'>
        <div className='flex items-center mb-6'>
          <Receipt className='w-6 h-6 text-blue-600 mr-2' />
          <div>
            <h2 className='text-2xl font-bold text-gray-900'>
              {editData ? 'Edit Invoice' : 'Create New Invoice'}
            </h2>
            {patientId && appointmentId && (
              <p className='text-sm text-green-600 mt-1'>
                ✓ Patient and appointment pre-selected from appointment details
              </p>
            )}
          </div>
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
                <p className='font-bold'>Invoice {editData ? 'Updated' : 'Created'} Successfully!</p>
                <p className='text-sm'>Redirecting to invoices page...</p>
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
              disabled={!!patientId}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                patientId ? 'bg-green-50 border-green-300' : ''
              }`}
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

          {/* Appointment Selection - Custom Dropdown */}
          <div className="relative">
            <label
              htmlFor='appointment_id'
              className='flex items-center text-sm font-medium text-gray-700 mb-2'>
              <Calendar className='w-4 h-4 mr-2' />
              Appointment (Optional)
            </label>
            
            {/* Custom Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAppointmentDropdownOpen(!isAppointmentDropdownOpen)}
                disabled={!formData.patient_id || !!appointmentId}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-left flex items-center justify-between disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  appointmentId ? 'bg-green-50 border-green-300' : ''
                }`}
              >
                <div className="flex items-center">
                  {selectedAppointment ? (
                    <>
                      <div className={`card-title w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getAvatarColor(selectedAppointment.DOCTOR_NAME || 'Doctor')} shadow-sm mr-3`}>
                        {getInitials(selectedAppointment.DOCTOR_NAME || 'Doctor')}
                      </div>
                      <span className={"card-title"}>
                        {selectedAppointment.DOCTOR_NAME} - {new Date(selectedAppointment.SCHEDULE).toLocaleDateString()}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500">
                      {!formData.patient_id ? 'Please select a patient first' : 'Select an appointment (optional)'}
                    </span>
                  )}
                </div>
                <ChevronDown className={`card-title w-4 h-4 transition-transform ${isAppointmentDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Options */}
              {isAppointmentDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {!formData.patient_id ? (
                    <div className="px-3 py-2 text-gray-500 text-center">
                      Please select a patient first
                    </div>
                  ) : appointments && appointments.length > 0 ? (
                    <>
                      <div
                        onClick={() => handleAppointmentSelect(null)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <Calendar className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-gray-500">No appointment</span>
                      </div>
                      
                      {appointments.map((appointment) => (
                        <div
                          key={appointment.APPOINTMENT_ID}
                          onClick={() => handleAppointmentSelect(appointment)}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getAvatarColor(appointment.DOCTOR_NAME || 'Doctor')} shadow-sm mr-3`}>
                            {getInitials(appointment.DOCTOR_NAME || 'Doctor')}
                          </div>
                          <div>
                            <div className="font-medium">{appointment.DOCTOR_NAME}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(appointment.SCHEDULE).toLocaleDateString()} - {appointment.REASON}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="px-3 py-2 text-gray-500 text-center">
                      No appointments found for this patient
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hidden input for form submission */}
            <input
              type="hidden"
              name="appointment_id"
              value={selectedAppointment?.APPOINTMENT_ID || ''}
            />
          </div>

          {/* Amount */}
          <div>
            <label
              htmlFor='amount'
              className='flex items-center text-sm font-medium text-gray-700 mb-2'
            >
              <DollarSign className='w-4 h-4 mr-2' />
              Amount (EGP) *
            </label>
            <input
              type='number'
              id='amount'
              name='amount'
              value={formData.amount}
              onChange={handleInputChange}
              required
              min='0'
              step='0.01'
              placeholder='0.00'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          {/* Discount */}
          <div>
            <label
              htmlFor='discount'
              className='flex items-center text-sm font-medium text-gray-700 mb-2'
            >
              <DollarSign className='w-4 h-4 mr-2' />
              Discount (EGP)
            </label>
            <input
              type='number'
              id='discount'
              name='discount'
              value={formData.discount}
              onChange={handleInputChange}
              min='0'
              step='0.01'
              placeholder='0.00'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          {/* Total Amount Display */}
          <div className='bg-gray-50 p-4 rounded-md'>
            <div className='flex justify-between items-center'>
              <span className='text-lg font-medium text-gray-700'>Total Amount:</span>
              <span className='text-2xl font-bold text-blue-600'>
                {calculateTotal().toFixed(2)} EGP
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label
              htmlFor='payment_method'
              className='flex items-center text-sm font-medium text-gray-700 mb-2'
            >
              <DollarSign className='w-4 h-4 mr-2' />
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

          {/* Paid Amount */}
          <div>
            <label
              htmlFor='paid_amount'
              className='flex items-center text-sm font-medium text-gray-700 mb-2'
            >
              <DollarSign className='w-4 h-4 mr-2' />
              Paid Amount (EGP)
            </label>
            <input
              type='number'
              id='paid_amount'
              name='paid_amount'
              value={formData.paid_amount}
              onChange={handleInputChange}
              min='0'
              max={calculateTotal()}
              step='0.01'
              placeholder='0.00'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
            <p className='text-sm text-gray-500 mt-1'>
              Maximum: {calculateTotal().toFixed(2)} EGP
            </p>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor='notes'
              className='flex items-center text-sm font-medium text-gray-700 mb-2'
            >
              <FileText className='w-4 h-4 mr-2' />
              Notes
            </label>
            <textarea
              id='notes'
              name='notes'
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder='Additional notes about this invoice...'
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
              {loading ? (editData ? 'Updating...' : 'Creating...') : (editData ? 'Update Invoice' : 'Create Invoice')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

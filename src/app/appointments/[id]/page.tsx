'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Calendar, Clock, FileText, User, Phone, Mail, ArrowLeft, Edit, Trash2, CreditCard, DollarSign, Receipt } from 'lucide-react';

import { Appointment, Doctor, Patient } from '@/lib/types';

import ErrorBoundary, { ErrorFallback } from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/LoadingSpinner';
import ButtonLink from '@/components/links/ButtonLink';
import { DOMAIN } from '@/lib/constants';

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isSuperAdmin = session?.user?.isAdmin || session?.user?.roleId === 211;

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`${DOMAIN}/api/appointments/${appointmentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch appointment details');
      }
      const data = await response.json();
      setAppointment(data);

      // Fetch doctor and patient details if IDs are available
      if (data.DOCTOR_ID) {
        fetchDoctor(data.DOCTOR_ID);
      }
      if (data.PATIENT_ID) {
       fetchPatient(data.PATIENT_ID);
      }

    } catch (err) {
      setError('Failed to fetch appointment details');
      console.error('Error fetching appointment:', err);
    } finally {
      setLoading(false);
    }
  };
  
  
  const fetchDoctor = async (doctorId: number) => {
    try {
      const response = await fetch(`${DOMAIN}/api/doctors/${doctorId}`);
      if (response.ok) {
        const data = await response.json();
        setDoctor(data);
      }
    } catch (err) {
      console.error('Error fetching doctor:', err);
    }
  };

  const fetchPatient = async (patientId: number) => {
    try {
      const response = await fetch(`${DOMAIN}/api/patients/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setPatient(data);
      }
    } catch (err) {
      console.error('Error fetching patient:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const response = await fetch(`${DOMAIN}/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete appointment');
      }

      router.push('/appointments');
    } catch (err) {
      setError('Failed to delete appointment');
      console.error('Error deleting appointment:', err);
    }
  };

  const formatDateTime = (date: Date | string | null | undefined) => {
    if (!date) {
      return 'Invalid Date';
    }

    try {
      let dateObj: Date;

      if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        return 'Invalid Date';
      }

      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }

      // Date only (no time, no "at")
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '✓';
      case 'pending':
        return '⏳';
      case 'cancelled':
        return '✗';
      default:
        return '?';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unpaid':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return '✓';
      case 'partial':
        return '⚠';
      case 'unpaid':
        return '✗';
      case 'refunded':
        return '↩';
      default:
        return '?';
    }
  };

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'follow_up':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Loading appointment details..." />
      </div>
    );
  }

  if (error) {
    return <ErrorFallback error={new Error(error)} reset={() => window.location.reload()} />;
  }

  if (!appointment) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Appointment not found</h2>
        <Link href="/appointments" className="text-blue-600 hover:underline">
          Back to appointments list
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <ButtonLink
            href="/appointments"
            variant="outline"
            leftIcon={ArrowLeft}
          >
            Back
          </ButtonLink>
          <div>
            <h2 className="text-2xl font-bold">Appointment Details</h2>
            <p className="text-gray-600">Appointment #{appointment.APPOINTMENT_ID}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!appointment.HAS_INVOICE && (
            <ButtonLink
              href={`/invoices/new?patientId=${appointment.PATIENT_ID}&appointmentId=${appointment.APPOINTMENT_ID}`}
              variant="primary"
              leftIcon={Receipt}
            >
              Create Invoice
            </ButtonLink>
          )}
          {(appointment.PAYMENT_STATUS !== 'paid' || isSuperAdmin) && (
            <ButtonLink
              href={`/appointments/${appointmentId}/edit`}
              variant="outline"
              leftIcon={Edit}
            >
              Edit
            </ButtonLink>
          )}
          {isSuperAdmin && (
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Appointment Status Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-xl font-bold">Appointment Status</h3>
                <p className="text-gray-600">Current status of the appointment</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full border-2 flex items-center gap-2 ${getStatusColor(appointment.STATUS)}`}>
              <span className="text-lg">{getStatusIcon(appointment.STATUS)}</span>
              <span className="font-semibold capitalize">{appointment.STATUS}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Scheduled Date & Time</p>
                <p className="text-gray-600">
                  {formatDateTime(appointment.SCHEDULE)}
                  {`  At  `}
                  {appointment.SCHEDULE_AT }
                </p>
              </div>
            </div>

            {appointment.REASON && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Reason for Visit</p>
                  <p className="text-gray-600">{appointment.REASON}</p>
                </div>
              </div>
            )}
          </div>

          {/* Appointment Type and Payment Information */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Appointment Type */}
              {appointment.APPOINTMENT_TYPE && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Appointment Type</p>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getAppointmentTypeColor(appointment.APPOINTMENT_TYPE)}`}>
                      <span className="capitalize">{appointment.APPOINTMENT_TYPE.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Status */}
              {appointment.PAYMENT_STATUS && (
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Payment Status</p>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(appointment.PAYMENT_STATUS)}`}>
                      <span>{getPaymentStatusIcon(appointment.PAYMENT_STATUS)}</span>
                      <span className="capitalize">{appointment.PAYMENT_STATUS.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Amount */}
              {appointment.PAYMENT_AMOUNT && appointment.PAYMENT_AMOUNT > 0 && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Payment Amount</p>
                    <p className="text-green-600 font-semibold">{appointment.PAYMENT_AMOUNT} EGP</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Information */}
          {appointment.HAS_INVOICE && appointment.INVOICE_ID && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Invoice Created</p>
                    {appointment.INVOICE_NUMBER && (
                      <p className="text-gray-600">Invoice #{appointment.INVOICE_NUMBER}</p>
                    )}
                  </div>
                </div>
                <Link
                  href={`/invoices/${appointment.INVOICE_ID}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  View Invoice
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Doctor Information */}
      {doctor && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold">Doctor Information</h3>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
              </div>
              <div className="flex-grow">
                <h4 className="text-lg font-semibold mb-2">Dr. {doctor.NAME}</h4>
                <p className="text-blue-600 font-medium mb-3">{doctor.SPECIALTY}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{doctor.EMAIL}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{doctor.PHONE}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <Link
                    href={`/doctors/${doctor.DOCTOR_ID}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Doctor Profile →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Information */}
      {patient && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold">Patient Information</h3>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
              </div>
              <div className="flex-grow">
                <h4 className="text-lg font-semibold mb-2">{patient.NAME}</h4>
                <p className="text-gray-600 mb-3">Patient ID: {patient.PATIENT_ID}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{patient.EMAIL}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{patient.PHONE}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <Link
                    href={`/patients/${patient.PATIENT_ID}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Patient Profile →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Notes */}
      {appointment.NOTE && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-gray-600" />
              <h3 className="text-xl font-bold">Additional Notes</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">{appointment.NOTE}</p>
          </div>
        </div>
      )}
    </div>
  );
}

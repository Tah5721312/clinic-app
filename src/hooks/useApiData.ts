import { useCallback, useEffect, useState } from 'react';

import { Appointment, Doctor, Patient } from '@/lib/types';

interface UseApiDataOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

interface UseApiDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApiData<T>(
  endpoint: string,
  options: UseApiDataOptions = {}
): UseApiDataReturn<T> {
  const { enabled = true, refetchInterval } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      // eslint-disable-next-line no-console
      console.error(`Error fetching data from ${endpoint}:`, err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refetchInterval, enabled]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// Specific hooks for common endpoints
export function useDoctors(specialty?: string) {
  const endpoint = specialty && specialty.trim()
    ? `/api/doctors?specialty=${encodeURIComponent(specialty)}`
    : '/api/doctors';
  return useApiData<Doctor[]>(endpoint);
}

export function usePatients(params?: { doctorId?: number | string; specialty?: string; identificationNumber?: string }) {
  const qs = new URLSearchParams();
  if (params?.doctorId) qs.set('doctorId', String(params.doctorId));
  if (params?.specialty && params.specialty.trim()) qs.set('specialty', params.specialty);
  if (params?.identificationNumber && params.identificationNumber.trim()) qs.set('identificationNumber', params.identificationNumber);
  const endpoint = qs.toString() ? `/api/patients?${qs.toString()}` : '/api/patients';
  return useApiData<Patient[]>(endpoint);
}

export function useAppointments() {
  return useApiData<Appointment[]>('/api/appointments');
}

export function useAppointmentsWithFilters(params?: {
  doctorId?: number | string;
  specialty?: string;
  identificationNumber?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.doctorId) qs.set('doctorId', String(params.doctorId));
  if (params?.specialty && params.specialty.trim()) qs.set('specialty', params.specialty);
  if (params?.identificationNumber && params.identificationNumber.trim()) qs.set('identificationNumber', params.identificationNumber);
  const endpoint = qs.toString() ? `/api/appointments?${qs.toString()}` : '/api/appointments';
  return useApiData<Appointment[]>(endpoint);
}

export function useAppointmentsByDoctor(doctorId: number | null) {
  const endpoint = doctorId ? `/api/appointments?doctorId=${doctorId}` : null;
  return useApiData<Appointment[]>(endpoint || '', { enabled: !!endpoint });
}

export function useAppointmentsByPatient(patientId: number | null) {
  const endpoint = patientId
    ? `/api/appointments?patientId=${patientId}`
    : null;
  return useApiData<Appointment[]>(endpoint || '', { enabled: !!endpoint });
}



export function useSpecialties() {
  return useApiData<string[]>('/api/specialties');
}
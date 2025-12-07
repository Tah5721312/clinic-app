import { useCallback, useEffect, useState, useRef, useMemo } from 'react';

import { Appointment, Doctor, Patient, MedicalRecord } from '@/lib/types';
import { DOMAIN } from '@/lib/constants';

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const endpointRef = useRef<string>(endpoint);

  // Update endpoint ref when it changes
  useEffect(() => {
    endpointRef.current = endpoint;
  }, [endpoint]);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);
      setError(null);

      const currentEndpoint = endpointRef.current;
      const response = await fetch(currentEndpoint, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Only update state if request wasn't aborted
      if (!abortController.signal.aborted) {
        setData(result);
      }
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      // eslint-disable-next-line no-console
      console.error(`Error fetching data from ${endpointRef.current}:`, err);
    } finally {
      // Only update loading if request wasn't aborted
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    fetchData();
    
    // Cleanup: abort request on unmount or when endpoint changes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, endpoint]);

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
export function useDoctors(params?: { specialty?: string; name?: string }) {
  const endpoint = useMemo(() => {
    const qs = new URLSearchParams();
    if (params?.specialty && params.specialty.trim()) {
      qs.set('specialty', params.specialty);
    }
    if (params?.name && params.name.trim()) {
      qs.set('name', params.name);
    }
    return qs.toString() ? `${DOMAIN}/api/doctors?${qs.toString()}` : `${DOMAIN}/api/doctors`;
  }, [params?.specialty, params?.name]);
  
  return useApiData<Doctor[]>(endpoint);
}

export function usePatients(params?: { doctorId?: number | string; specialty?: string; identificationNumber?: string; name?: string }) {
  const endpoint = useMemo(() => {
    const qs = new URLSearchParams();
    if (params?.doctorId) qs.set('doctorId', String(params.doctorId));
    if (params?.specialty && params.specialty.trim()) qs.set('specialty', params.specialty);
    if (params?.identificationNumber && params.identificationNumber.trim()) qs.set('identificationNumber', params.identificationNumber);
    if (params?.name && params.name.trim()) qs.set('name', params.name);
    return qs.toString() ? `${DOMAIN}/api/patients?${qs.toString()}` : `${DOMAIN}/api/patients`;
  }, [params?.doctorId, params?.specialty, params?.identificationNumber, params?.name]);
  
  return useApiData<Patient[]>(endpoint);
}

export function useAppointments() {
  return useApiData<Appointment[]>(`${DOMAIN}/api/appointments`);
}

export function useMedicalRecords(params?: { patientId?: number | string; doctorId?: number | string }) {
  const endpoint = useMemo(() => {
    const qs = new URLSearchParams();
    if (params?.patientId) qs.set('patientId', String(params.patientId));
    if (params?.doctorId) qs.set('doctorId', String(params.doctorId));
    return qs.toString() ? `${DOMAIN}/api/medical-records?${qs.toString()}` : `${DOMAIN}/api/medical-records`;
  }, [params?.patientId, params?.doctorId]);
  
  return useApiData<MedicalRecord[]>(endpoint);
}

export function useAppointmentsWithFilters(params?: {
  doctorId?: number | string;
  specialty?: string;
  identificationNumber?: string;
  invoiceNumber?: string;
  scheduleDate?: string;
  patientName?: string;
}) {
  // Extract values for proper memoization
  const doctorId = params?.doctorId;
  const specialty = params?.specialty?.trim() || undefined;
  const identificationNumber = params?.identificationNumber?.trim() || undefined;
  const invoiceNumber = params?.invoiceNumber?.trim() || undefined;
  const scheduleDate = params?.scheduleDate?.trim() || undefined;
  const patientName = params?.patientName?.trim() || undefined;
  
  // Memoize endpoint to prevent unnecessary re-fetches
  const endpoint = useMemo(() => {
    const qs = new URLSearchParams();
    if (doctorId) qs.set('doctorId', String(doctorId));
    if (specialty) qs.set('specialty', specialty);
    if (identificationNumber) qs.set('identificationNumber', identificationNumber);
    if (invoiceNumber) qs.set('invoiceNumber', invoiceNumber);
    if (scheduleDate) qs.set('scheduleDate', scheduleDate);
    if (patientName) qs.set('patientName', patientName);
    return qs.toString() ? `${DOMAIN}/api/appointments?${qs.toString()}` : `${DOMAIN}/api/appointments`;
  }, [doctorId, specialty, identificationNumber, invoiceNumber, scheduleDate, patientName]);
  
  return useApiData<Appointment[]>(endpoint);
}

export function useAppointmentsByDoctor(doctorId: number | null) {
  const endpoint = doctorId ? `${DOMAIN}/api/appointments?doctorId=${doctorId}` : null;
  return useApiData<Appointment[]>(endpoint || '', { enabled: !!endpoint });
}

export function useAppointmentsByPatient(patientId: number | null) {
  const endpoint = patientId
    ? `${DOMAIN}/api/appointments?patientId=${patientId}`
    : null;
  return useApiData<Appointment[]>(endpoint || '', { enabled: !!endpoint });
}



export function useSpecialties() {
  return useApiData<string[]>(`${DOMAIN}/api/specialties`);
}
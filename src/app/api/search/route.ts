import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';
import oracledb from 'oracledb';

interface SearchResult {
  type: 'patient' | 'doctor' | 'appointment' | 'invoice';
  id: number;
  title: string;
  subtitle: string;
  description?: string;
  href: string;
  relevance: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [], total: 0 });
    }

    const searchTerm = query.trim().toUpperCase();
    const connection = await getConnection();
    const results: SearchResult[] = [];

    try {
      // Search Patients
      const patientQuery = `
        SELECT 
          PATIENT_ID,
          NAME,
          IDENTIFICATIONNUMBER,
          PHONE,
          EMAIL
        FROM tah57.PATIENTS
        WHERE UPPER(NAME) LIKE :search
           OR UPPER(IDENTIFICATIONNUMBER) LIKE :search
           OR UPPER(PHONE) LIKE :search
           OR UPPER(EMAIL) LIKE :search
        ORDER BY 
          CASE 
            WHEN UPPER(NAME) = :search THEN 1
            WHEN UPPER(NAME) LIKE :searchPrefix THEN 2
            ELSE 3
          END,
          NAME
        FETCH FIRST :limit ROWS ONLY
      `;

      const patientResult = await connection.execute<{
        PATIENT_ID: number;
        NAME: string;
        IDENTIFICATIONNUMBER: string;
        PHONE: string;
        EMAIL: string;
      }>(
        patientQuery,
        {
          search: `%${searchTerm}%`,
          searchPrefix: `${searchTerm}%`,
          limit,
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (patientResult.rows) {
        patientResult.rows.forEach((patient) => {
          const relevance = calculateRelevance(searchTerm, [
            patient.NAME,
            patient.IDENTIFICATIONNUMBER,
            patient.PHONE,
            patient.EMAIL,
          ]);

          results.push({
            type: 'patient',
            id: patient.PATIENT_ID,
            title: patient.NAME,
            subtitle: `ID: ${patient.IDENTIFICATIONNUMBER || 'N/A'}`,
            description: `${patient.PHONE || 'N/A'} • ${patient.EMAIL || 'No email'}`,
            href: `/patients/${patient.PATIENT_ID}`,
            relevance,
          });
        });
      }

      // Search Doctors
      const doctorQuery = `
        SELECT 
          DOCTOR_ID,
          NAME,
          EMAIL,
          PHONE,
          SPECIALTY
        FROM tah57.DOCTORS
        WHERE UPPER(NAME) LIKE :search
           OR UPPER(EMAIL) LIKE :search
           OR UPPER(PHONE) LIKE :search
           OR UPPER(SPECIALTY) LIKE :search
        ORDER BY 
          CASE 
            WHEN UPPER(NAME) = :search THEN 1
            WHEN UPPER(NAME) LIKE :searchPrefix THEN 2
            ELSE 3
          END,
          NAME
        FETCH FIRST :limit ROWS ONLY
      `;

      const doctorResult = await connection.execute<{
        DOCTOR_ID: number;
        NAME: string;
        EMAIL: string;
        PHONE: string;
        SPECIALTY: string;
      }>(
        doctorQuery,
        {
          search: `%${searchTerm}%`,
          searchPrefix: `${searchTerm}%`,
          limit,
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (doctorResult.rows) {
        doctorResult.rows.forEach((doctor) => {
          const relevance = calculateRelevance(searchTerm, [
            doctor.NAME,
            doctor.EMAIL,
            doctor.PHONE,
            doctor.SPECIALTY,
          ]);

          results.push({
            type: 'doctor',
            id: doctor.DOCTOR_ID,
            title: doctor.NAME,
            subtitle: doctor.SPECIALTY || 'No specialty',
            description: `${doctor.EMAIL || 'No email'} • ${doctor.PHONE || 'No phone'}`,
            href: `/doctors/${doctor.DOCTOR_ID}`,
            relevance,
          });
        });
      }

      // Search Appointments
      const appointmentQuery = `
        SELECT 
          a.APPOINTMENT_ID,
          a.SCHEDULE AS APPOINTMENT_DATE,
          p.NAME AS PATIENT_NAME,
          d.NAME AS DOCTOR_NAME,
          a.STATUS,
          a.PAYMENT_STATUS
        FROM tah57.APPOINTMENTS a
        LEFT JOIN tah57.PATIENTS p ON a.PATIENT_ID = p.PATIENT_ID
        LEFT JOIN tah57.DOCTORS d ON a.DOCTOR_ID = d.DOCTOR_ID
        WHERE UPPER(p.NAME) LIKE :search
           OR UPPER(d.NAME) LIKE :search
           OR TO_CHAR(a.SCHEDULE, 'YYYY-MM-DD') LIKE :search
        ORDER BY a.SCHEDULE DESC
        FETCH FIRST :limit ROWS ONLY
      `;

      const appointmentResult = await connection.execute<{
        APPOINTMENT_ID: number;
        APPOINTMENT_DATE: Date;
        PATIENT_NAME: string;
        DOCTOR_NAME: string;
        STATUS: string;
        PAYMENT_STATUS: string;
      }>(
        appointmentQuery,
        {
          search: `%${searchTerm}%`,
          limit,
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (appointmentResult.rows) {
        appointmentResult.rows.forEach((appointment) => {
          const date = new Date(appointment.APPOINTMENT_DATE);
          const relevance = calculateRelevance(searchTerm, [
            appointment.PATIENT_NAME || '',
            appointment.DOCTOR_NAME || '',
          ]);

          results.push({
            type: 'appointment',
            id: appointment.APPOINTMENT_ID,
            title: `${appointment.PATIENT_NAME || 'Unknown'} - ${appointment.DOCTOR_NAME || 'Unknown'}`,
            subtitle: `Date: ${date.toLocaleDateString()}`,
            description: `Status: ${appointment.STATUS || 'N/A'} • Payment: ${appointment.PAYMENT_STATUS || 'N/A'}`,
            href: `/appointments/${appointment.APPOINTMENT_ID}`,
            relevance,
          });
        });
      }

      // Search Invoices
      const invoiceQuery = `
        SELECT 
          i.INVOICE_ID,
          i.INVOICE_DATE,
          i.TOTAL_AMOUNT,
          i.PAYMENT_STATUS,
          p.NAME AS PATIENT_NAME,
          d.NAME AS DOCTOR_NAME
        FROM tah57.INVOICES i
        LEFT JOIN tah57.PATIENTS p ON i.PATIENT_ID = p.PATIENT_ID
        LEFT JOIN tah57.APPOINTMENTS a ON i.APPOINTMENT_ID = a.APPOINTMENT_ID
        LEFT JOIN tah57.DOCTORS d ON a.DOCTOR_ID = d.DOCTOR_ID
        WHERE UPPER(p.NAME) LIKE :search
           OR UPPER(d.NAME) LIKE :search
           OR TO_CHAR(i.INVOICE_ID) LIKE :search
           OR TO_CHAR(i.INVOICE_DATE, 'YYYY-MM-DD') LIKE :search
        ORDER BY i.INVOICE_DATE DESC
        FETCH FIRST :limit ROWS ONLY
      `;

      const invoiceResult = await connection.execute<{
        INVOICE_ID: number;
        INVOICE_DATE: Date;
        TOTAL_AMOUNT: number;
        PAYMENT_STATUS: string;
        PATIENT_NAME: string;
        DOCTOR_NAME: string;
      }>(
        invoiceQuery,
        {
          search: `%${searchTerm}%`,
          limit,
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (invoiceResult.rows) {
        invoiceResult.rows.forEach((invoice) => {
          const date = new Date(invoice.INVOICE_DATE);
          const relevance = calculateRelevance(searchTerm, [
            invoice.PATIENT_NAME || '',
            invoice.DOCTOR_NAME || '',
            invoice.INVOICE_ID.toString(),
          ]);

          results.push({
            type: 'invoice',
            id: invoice.INVOICE_ID,
            title: `Invoice #${invoice.INVOICE_ID}`,
            subtitle: `${invoice.PATIENT_NAME || 'Unknown'} - ${invoice.DOCTOR_NAME || 'Unknown'}`,
            description: `${date.toLocaleDateString()} • ${invoice.TOTAL_AMOUNT || 0} EGP • ${invoice.PAYMENT_STATUS || 'N/A'}`,
            href: `/invoices/${invoice.INVOICE_ID}`,
            relevance,
          });
        });
      }

      // Sort by relevance (higher relevance first)
      results.sort((a, b) => b.relevance - a.relevance);

      return NextResponse.json({
        results: results.slice(0, limit),
        total: results.length,
        query: searchTerm,
      });
    } finally {
      await connection.close();
    }
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        error: 'Failed to perform search',
        details: error.message,
        results: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate relevance score
function calculateRelevance(searchTerm: string, fields: string[]): number {
  let relevance = 0;
  const upperSearch = searchTerm.toUpperCase();

  fields.forEach((field, index) => {
    if (!field) return;

    const upperField = field.toUpperCase();

    // Exact match = highest score
    if (upperField === upperSearch) {
      relevance += 100 * (fields.length - index);
    }
    // Starts with search term = high score
    else if (upperField.startsWith(upperSearch)) {
      relevance += 50 * (fields.length - index);
    }
    // Contains search term = medium score
    else if (upperField.includes(upperSearch)) {
      relevance += 25 * (fields.length - index);
    }
  });

  return relevance;
}


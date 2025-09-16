'use client';

import { useEffect, useState } from 'react';

type Patient = {
  patient_id: number;
  name: string;
  email: string;
  phone: string;
  // Add other patient fields here
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await fetch('/api/patients');
        const data = await res.json();
        setPatients(data);
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  if (loading) {
    return <p className="text-center mt-8">Loading patients...</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Patient Directory</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.length > 0 ? (
          patients.map((patient) => (
            <div key={patient.patient_id} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-2">{patient.name}</h2>
              <p className="text-gray-600">Email: {patient.email}</p>
              <p className="text-gray-600">Phone: {patient.phone}</p>
              <a href={`/patients/${patient.patient_id}`} className="text-blue-500 hover:underline mt-4 inline-block">View Profile</a>
            </div>
          ))
        ) : (
          <p>No patients found.</p>
        )}
      </div>
    </div>
  );
}
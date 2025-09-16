// app/api/doctors/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDoctorById, updateDoctor, deleteDoctor } from '@/lib/db_utils';

interface Params {
  params: {
    id: string;
  };
}

// GET - جلب طبيب محدد
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const doctor = await getDoctorById(Number(id));
    
    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(doctor);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctor' },
      { status: 500 }
    );
  }
}


// PUT - تحديث طبيب


export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // التحقق من أن الـ ID صحيح
    if (isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid doctor ID' },
        { status: 400 }
      );
    }
    
    // التحقق من وجود حقول للتحديث
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }
    
    // التحقق من صحة البريد الإلكتروني إذا كان موجوداً
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }
    
    const rowsAffected = await updateDoctor(Number(id), body);
    
    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'Doctor not found or no changes made' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Doctor updated successfully',
      rowsAffected 
    });
    
  } catch (error: unknown) {
    console.error('Error updating doctor:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // التحقق إذا كان الخطأ بسبب تكرار بيانات
    if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate')) {
      return NextResponse.json(
        { 
          error: 'Duplicate entry',
          details: 'A doctor with this email or phone already exists' 
        },
        { status: 409 }
      );
    }
    
    // التحقق إذا كان الخطأ بسبب عدم وجود حقول للتحديث
    if (errorMessage.includes('No fields to update')) {
      return NextResponse.json(
        { 
          error: 'No fields to update',
          details: 'Please provide at least one field to update' 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update doctor',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

// DELETE - حذف طبيب
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
    const rowsAffected = await deleteDoctor(Number(id));
    
    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return NextResponse.json(
      { error: 'Failed to delete doctor' },
      { status: 500 }
    );
  }
}
// app/api/doctors/route.ts - النسخة المحسنة
import { NextRequest, NextResponse } from 'next/server';
import { createDoctor, getAllDoctors } from '@/lib/db_utils';

// GET - جلب جميع الأطباء
export async function GET() {
  try {
    const doctors = await getAllDoctors();
    return NextResponse.json(doctors);
  } catch (error: unknown) {
    console.error('Error fetching doctors:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch doctors: ' + errorMessage },
      { status: 500 }
    );
  }
}

// POST - إضافة طبيب جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // التحقق من البيانات المطلوبة
    if (!body.name || !body.email || !body.phone || !body.specialty) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: 'Name, email, phone, and specialty are required' 
        },
        { status: 400 }
      );
    }
    
    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    const id = await createDoctor(body);
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Doctor added successfully', 
        id: id,
        data: body
      },
      { status: 201 }
    );
    
  } catch (error: unknown) {
    console.error('Error adding doctor:', error);
    
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
    
    return NextResponse.json(
      { 
        error: 'Failed to add doctor',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
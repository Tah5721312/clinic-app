// app/api/specialties/all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllSpecialties } from '@/lib/db_utils';

// GET - جلب جميع التخصصات مع التفاصيل الكاملة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false'; // Default to true

    console.log('🔍 Fetching specialties from database, activeOnly:', activeOnly);
    const specialties = await getAllSpecialties(activeOnly);
    console.log('✅ Retrieved specialties from database:', specialties?.length || 0, 'specialties');
    
    return NextResponse.json(specialties);
  } catch (error) {
    console.error('❌ Error fetching all specialties:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to fetch specialties',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}


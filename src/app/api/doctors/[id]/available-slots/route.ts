// app/api/doctors/[id]/available-slots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAvailableTimeSlots } from '@/lib/db_utils';
import { auth } from '@/auth';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET - جلب الأوقات المتاحة للطبيب في يوم معين
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const doctorId = Number(id);
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (isNaN(doctorId)) {
      return NextResponse.json(
        { error: 'Invalid doctor ID' },
        { status: 400 }
      );
    }

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Parse and validate date
    const date = new Date(dateParam);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Check if date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return NextResponse.json(
        { error: 'Cannot get slots for past dates' },
        { status: 400 }
      );
    }

    // Check if user has permission to view available slots
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Allow all authenticated users to view available slots
    // (patients need this to book appointments, doctors to see their schedule)

    const timeSlots = await getAvailableTimeSlots(doctorId, date);

    return NextResponse.json({
      doctorId,
      date: date.toISOString().split('T')[0],
      timeSlots
    });

  } catch (error) {
    console.error('Error fetching available time slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available time slots' },
      { status: 500 }
    );
  }
}

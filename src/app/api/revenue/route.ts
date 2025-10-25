import { NextRequest, NextResponse } from 'next/server';
import {
  getTotalRevenue,
  getCurrentMonthRevenue,
  getCurrentDayRevenue,
  getTotalPaidRevenue,
  getTotalRemainingRevenue,
} from '@/lib/db_utils';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await auth();

    // Check if user has permission to view revenue data
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let revenueData;

    switch (type) {
      case 'total':
        revenueData = await getTotalRevenue();
        break;
      case 'monthly':
        revenueData = await getCurrentMonthRevenue();
        break;
      case 'daily':
        revenueData = await getCurrentDayRevenue();
        break;
      case 'paid':
        revenueData = await getTotalPaidRevenue();
        break;
      case 'remaining':
        revenueData = await getTotalRemainingRevenue();
        break;
      case 'all':
        const [
          totalRevenue,
          monthlyRevenue,
          dailyRevenue,
          paidRevenue,
          remainingRevenue,
        ] = await Promise.all([
          getTotalRevenue(),
          getCurrentMonthRevenue(),
          getCurrentDayRevenue(),
          getTotalPaidRevenue(),
          getTotalRemainingRevenue(),
        ]);

        revenueData = {
          total: totalRevenue,
          monthly: monthlyRevenue,
          daily: dailyRevenue,
          paid: paidRevenue,
          remaining: remainingRevenue,
        };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: total, monthly, daily, paid, remaining, or all' },
          { status: 400 }
        );
    }

    return NextResponse.json(revenueData);
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}

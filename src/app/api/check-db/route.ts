// app/api/check-db/route.ts
import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/database';

export async function GET() {
  try {
    const isConnected = await checkDatabaseConnection();
    
    if (isConnected) {
      return NextResponse.json({ 
        status: 'success', 
        message: 'تم الاتصال بقاعدة البيانات بنجاح' 
      });
    } else {
      return NextResponse.json({ 
        status: 'error', 
        message: 'فشل الاتصال بقاعدة البيانات' 
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'حدث خطأ أثناء محاولة الاتصال بقاعدة البيانات',
    }, { status: 500 });
  }
}
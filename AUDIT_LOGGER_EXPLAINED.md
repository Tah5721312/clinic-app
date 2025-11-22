# شرح Audit Logger - نظام تسجيل إجراءات المستخدمين

## 🎯 ما هو Audit Logger؟

**Audit Logger** هو نظام لتسجيل وتتبع جميع إجراءات المستخدمين في التطبيق لأغراض:
- 🔒 **الأمان** - معرفة من فعل ماذا ومتى
- 📊 **الامتثال** - تلبية متطلبات الأمان والامتثال
- 🐛 **التشخيص** - تتبع المشاكل والأخطاء
- 📈 **التحليل** - فهم سلوك المستخدمين

---

## 📝 ماذا يفعل الملف؟

### 1. `logAuditEvent()` - تسجيل حدث

```typescript
await logAuditEvent({
  user_id: 123,
  action: 'create',
  resource: 'Appointment',
  resource_id: 456,
  ip_address: '192.168.1.1',
  status: 'success'
});
```

**ما يحدث:**
1. ✅ ينشئ جدول `audit_logs` تلقائياً إذا لم يكن موجوداً
2. ✅ يسجل الحدث في قاعدة البيانات
3. ✅ يحفظ: user_id, action, resource, IP, user agent, status, error

**مثال على البيانات المحفوظة:**
```
user_id: 123
action: "create"
resource: "Appointment"
resource_id: 456
ip_address: "192.168.1.1"
user_agent: "Mozilla/5.0..."
status: "success"
created_at: "2024-01-15 10:30:00"
```

### 2. `getAuditLogs()` - جلب السجلات

```typescript
// جلب جميع السجلات
const logs = await getAuditLogs();

// جلب سجلات مستخدم معين
const userLogs = await getAuditLogs(123, 50); // آخر 50 سجل
```

---

## ⚡ متى يعمل؟

### حالياً: يعمل تلقائياً مع `apiHelper.ts`

عند استخدام `handleApiRoute` في API routes:

```typescript
// src/app/api/patients/route.ts
import { handleApiRoute } from '@/lib/apiHelper';

export async function POST(request: NextRequest) {
  return handleApiRoute(
    request,
    async (req) => {
      // منطق إنشاء مريض
      const patient = await createPatient(data);
      return patient;
    },
    {
      action: 'create',        // ✅ يسجل "create"
      resource: 'Patient',     // ✅ يسجل "Patient"
      userId: await getUserIdFromRequest(request),
      sanitizeInput: true
    }
  );
}
```

**ما يحدث تلقائياً:**
- ✅ عند النجاح: يسجل `action: "create", resource: "Patient", status: "success"`
- ✅ عند الفشل: يسجل `status: "failure"` مع `error_message`

---

## 📊 أمثلة عملية

### مثال 1: إنشاء موعد جديد

```typescript
// المستخدم ينشئ موعد
POST /api/appointments

// يتم تسجيل:
{
  user_id: 123,
  action: "create",
  resource: "Appointment",
  resource_id: 789,
  ip_address: "192.168.1.1",
  status: "success",
  created_at: "2024-01-15 10:30:00"
}
```

### مثال 2: حذف مريض (فشل)

```typescript
// المستخدم يحاول حذف مريض لكن فشل
DELETE /api/patients/456

// يتم تسجيل:
{
  user_id: 123,
  action: "delete",
  resource: "Patient",
  resource_id: 456,
  ip_address: "192.168.1.1",
  status: "failure",
  error_message: "Patient has active appointments",
  created_at: "2024-01-15 10:35:00"
}
```

### مثال 3: تحديث بيانات طبيب

```typescript
// المستخدم يحدث بيانات طبيب
PUT /api/doctors/789

// يتم تسجيل:
{
  user_id: 123,
  action: "update",
  resource: "Doctor",
  resource_id: 789,
  ip_address: "192.168.1.1",
  status: "success",
  created_at: "2024-01-15 10:40:00"
}
```

---

## 🔧 كيفية الاستخدام المباشر

### استخدام مباشر في API Route

```typescript
// src/app/api/appointments/route.ts
import { logAuditEvent } from '@/lib/auditLogger';
import { getClientIP } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const ip = getClientIP(request.headers);
  
  try {
    // إنشاء الموعد
    const appointment = await createAppointment(data);
    
    // تسجيل الحدث
    await logAuditEvent({
      user_id: userId,
      action: 'create',
      resource: 'Appointment',
      resource_id: appointment.id,
      ip_address: ip,
      user_agent: request.headers.get('user-agent') || undefined,
      status: 'success',
      details: `Created appointment for patient ${appointment.patientId}`
    });
    
    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    // تسجيل الفشل
    await logAuditEvent({
      user_id: userId,
      action: 'create',
      resource: 'Appointment',
      ip_address: ip,
      status: 'failure',
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}
```

---

## 📋 جدول قاعدة البيانات

عند أول استخدام، يتم إنشاء الجدول تلقائياً:

```sql
CREATE TABLE audit_logs (
  id NUMBER PRIMARY KEY,
  user_id NUMBER,                    -- ID المستخدم
  action VARCHAR2(100),              -- create, update, delete, read
  resource VARCHAR2(100),            -- Patient, Doctor, Appointment
  resource_id NUMBER,                -- ID المورد (مثل patient_id)
  details CLOB,                      -- تفاصيل إضافية
  ip_address VARCHAR2(45),          -- عنوان IP
  user_agent VARCHAR2(500),         -- معلومات المتصفح
  status VARCHAR2(20),               -- success أو failure
  error_message VARCHAR2(1000),      -- رسالة الخطأ (إن وجدت)
  created_at TIMESTAMP               -- وقت الحدث
);
```

---

## 🎯 متى تستخدمه؟

### ✅ استخدمه في:

1. **عمليات حساسة:**
   - إنشاء/تحديث/حذف بيانات
   - تغيير الصلاحيات
   - عمليات الدفع
   - تسجيل الدخول/الخروج

2. **عمليات مهمة:**
   - تصدير البيانات
   - الوصول لبيانات حساسة
   - تغيير الإعدادات

### ❌ لا تستخدمه في:

- قراءة البيانات العادية (GET requests)
- عمليات بسيطة غير مهمة
- عمليات داخلية فقط

---

## 📊 عرض السجلات

### API Endpoint لعرض السجلات (يمكن إضافتها)

```typescript
// src/app/api/audit-logs/route.ts
import { getAuditLogs } from '@/lib/auditLogger';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  // فقط للمدراء
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  const userId = request.nextUrl.searchParams.get('userId');
  const limit = Number(request.nextUrl.searchParams.get('limit')) || 100;
  
  const logs = await getAuditLogs(
    userId ? Number(userId) : undefined,
    limit
  );
  
  return NextResponse.json({ logs });
}
```

### صفحة لعرض السجلات (يمكن إضافتها)

```tsx
// src/app/audit-logs/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchLogs() {
      const res = await fetch('/api/audit-logs?limit=100');
      const data = await res.json();
      setLogs(data.logs);
      setLoading(false);
    }
    fetchLogs();
  }, []);
  
  return (
    <div>
      <h1>Audit Logs</h1>
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Action</th>
            <th>Resource</th>
            <th>Status</th>
            <th>IP</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{log.user_id}</td>
              <td>{log.action}</td>
              <td>{log.resource}</td>
              <td>{log.status}</td>
              <td>{log.ip_address}</td>
              <td>{new Date(log.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🔒 الأمان

### المميزات الأمنية:

1. **لا يكسر التطبيق:**
   - إذا فشل التسجيل، لا يؤثر على العملية الأصلية
   - يتم catch الأخطاء بصمت

2. **تسجيل شامل:**
   - IP address لتتبع المصدر
   - User agent لتحديد الجهاز/المتصفح
   - Timestamp دقيق

3. **مرن:**
   - يمكن إضافة تفاصيل إضافية
   - يمكن تخصيص الحقول

---

## 📈 حالات الاستخدام

### 1. تتبع المشاكل

```
"لماذا فشل إنشاء الموعد؟"
→ ابحث في audit_logs عن action="create", resource="Appointment", status="failure"
```

### 2. مراجعة الأمان

```
"من حذف هذا المريض؟"
→ ابحث في audit_logs عن resource="Patient", resource_id=123, action="delete"
```

### 3. تحليل الاستخدام

```
"كم مرة تم إنشاء مواعيد اليوم؟"
→ SELECT COUNT(*) FROM audit_logs 
   WHERE action='create' AND resource='Appointment' 
   AND created_at >= TRUNC(SYSDATE)
```

### 4. تتبع المستخدمين المشبوهين

```
"من يحاول الوصول لبيانات حساسة؟"
→ ابحث عن user_id مع status="failure" متكرر
```

---

## 🚀 الخطوات التالية

1. ✅ **تم**: إنشاء النظام
2. ⏳ **يمكن إضافته**: API endpoint لعرض السجلات
3. ⏳ **يمكن إضافته**: صفحة واجهة لعرض السجلات
4. ⏳ **يمكن إضافته**: فلاتر وبحث في السجلات
5. ⏳ **يمكن إضافته**: إشعارات للأحداث المهمة

---

## 💡 ملاحظات مهمة

1. **الأداء:**
   - التسجيل غير متزامن (async) - لا يبطئ التطبيق
   - يمكن إضافة queue للـ logs الكثيرة

2. **التخزين:**
   - الجدول قد يكبر بسرعة
   - يُنصح بحذف السجلات القديمة دورياً (مثلاً بعد 90 يوم)

3. **الخصوصية:**
   - IP addresses قد تكون بيانات حساسة
   - اتبع قوانين حماية البيانات (GDPR)

---

## الخلاصة

**Audit Logger** هو نظام قوي لتتبع إجراءات المستخدمين:
- ✅ يعمل تلقائياً مع `apiHelper.ts`
- ✅ يمكن استخدامه مباشرة في أي API route
- ✅ يسجل النجاح والفشل
- ✅ يحفظ معلومات كاملة (IP, user agent, timestamp)
- ✅ آمن ولا يكسر التطبيق

**استخدمه في كل العمليات المهمة!** 🔒


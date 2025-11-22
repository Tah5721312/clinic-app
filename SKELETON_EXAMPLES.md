# أمثلة استخدام Skeleton Components

## ما هي Skeleton Components؟

**Skeleton Components** هي مكونات تعرض **شكل تقريبي** للمحتوى أثناء التحميل، بدلاً من شاشة فارغة أو spinner فقط.

### الفوائد:

- ✅ **تجربة مستخدم أفضل** - المستخدم يعرف أن الصفحة تعمل
- ✅ **إحساس أسرع** - يبدو أن التطبيق أسرع حتى لو لم يكن كذلك
- ✅ **تقليل القلق** - المستخدم لا يشعر أن التطبيق "علق"
- ✅ **مظهر احترافي** - مثل Facebook, LinkedIn, Twitter

---

## المكونات المتوفرة

### 1. `CardSkeleton` - للبطاقات

```tsx
import { CardSkeleton } from '@/components/LoadingSkeleton';

function PatientCard({ patient, loading }) {
  if (loading) {
    return <CardSkeleton />;
  }

  return (
    <div className='card'>
      <h3>{patient.name}</h3>
      <p>{patient.email}</p>
    </div>
  );
}
```

**النتيجة**: يظهر شكل تقريبي لبطاقة مع خطوط رمادية متحركة.

---

### 2. `TableSkeleton` - للجداول

```tsx
import { TableSkeleton } from '@/components/LoadingSkeleton';

function PatientsTable() {
  const { data: patients, loading } = usePatients();

  if (loading) {
    return <TableSkeleton rows={10} />; // 10 صفوف
  }

  return (
    <table>
      {patients.map((patient) => (
        <tr key={patient.id}>
          <td>{patient.name}</td>
          <td>{patient.email}</td>
        </tr>
      ))}
    </table>
  );
}
```

**النتيجة**: يظهر جدول كامل مع headers و rows (10 صفوف) بشكل تقريبي.

---

### 3. `StatCardSkeleton` - لإحصائيات Dashboard

```tsx
import { StatCardSkeleton } from '@/components/LoadingSkeleton';

function DashboardStats() {
  const { data: stats, loading } = useStats();

  if (loading) {
    return (
      <div className='grid grid-cols-3 gap-4'>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  return (
    <div className='grid grid-cols-3 gap-4'>
      <StatCard title='Patients' value={stats.patients} />
      <StatCard title='Doctors' value={stats.doctors} />
      <StatCard title='Appointments' value={stats.appointments} />
    </div>
  );
}
```

**النتيجة**: يظهر 3 بطاقات إحصائية بشكل تقريبي مع icon دائري.

---

### 4. `ListSkeleton` - للقوائم

```tsx
import { ListSkeleton } from '@/components/LoadingSkeleton';

function AppointmentsList() {
  const { data: appointments, loading } = useAppointments();

  if (loading) {
    return <ListSkeleton items={5} />; // 5 عناصر
  }

  return (
    <ul>
      {appointments.map((apt) => (
        <li key={apt.id}>{apt.patientName}</li>
      ))}
    </ul>
  );
}
```

**النتيجة**: يظهر 5 عناصر قائمة بشكل تقريبي.

---

### 5. `FormSkeleton` - للنماذج

```tsx
import { FormSkeleton } from '@/components/LoadingSkeleton';

function AppointmentForm({ loading }) {
  if (loading) {
    return <FormSkeleton />;
  }

  return (
    <form>
      <input name='patient' />
      <input name='date' />
      <button>Submit</button>
    </form>
  );
}
```

**النتيجة**: يظهر نموذج مع 4 حقول input و button بشكل تقريبي.

---

## مثال كامل - صفحة Patients

```tsx
'use client';

import { useState, useEffect } from 'react';
import { TableSkeleton, CardSkeleton } from '@/components/LoadingSkeleton';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatients() {
      setLoading(true);
      try {
        const res = await fetch('/api/patients');
        const data = await res.json();
        setPatients(data);
      } finally {
        setLoading(false);
      }
    }

    fetchPatients();
  }, []);

  if (loading) {
    return (
      <div className='space-y-6'>
        <h1 className='text-3xl font-bold'>Patients</h1>
        <TableSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <h1 className='text-3xl font-bold'>Patients</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id}>
              <td>{patient.name}</td>
              <td>{patient.email}</td>
              <td>{patient.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## مثال مع Dashboard

```tsx
import { StatCardSkeleton } from '@/components/LoadingSkeleton';

function Dashboard() {
  const { data: stats, loading } = useStats();

  return (
    <div>
      <h1>Dashboard</h1>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard title='Patients' value={stats.patients} />
            <StatCard title='Doctors' value={stats.doctors} />
            <StatCard title='Appointments' value={stats.appointments} />
          </>
        )}
      </div>
    </div>
  );
}
```

---

## المميزات

### 1. **Animation تلقائية**

- يستخدم `animate-pulse` من Tailwind
- حركة ناعمة ومريحة للعين

### 2. **Dark Mode Support**

- يعمل مع الوضع الفاتح والداكن
- ألوان مختلفة لكل وضع

### 3. **Customizable**

- يمكن تحديد عدد الصفوف/العناصر
- يمكن تخصيص الألوان والأحجام

### 4. **Responsive**

- يعمل على جميع الشاشات
- يتكيف مع التصميم

---

## المقارنة

### ❌ بدون Skeleton (سيء)

```
[Loading...] ← spinner فقط
```

### ✅ مع Skeleton (جيد)

```
┌─────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← شكل تقريبي
│ ▓▓▓▓▓▓▓▓▓▓     │
└─────────────────┘
```

---

## نصائح الاستخدام

1. **استخدم Skeleton أثناء التحميل الأولي فقط**

   ```tsx
   if (loading && !data) {
     return <TableSkeleton />;
   }
   ```

2. **لا تستخدم Skeleton للـ updates الصغيرة**

   ```tsx
   // ❌ سيء - Skeleton لكل update
   if (loading) return <Skeleton />;

   // ✅ جيد - Skeleton للتحميل الأولي فقط
   if (loading && !data) return <Skeleton />;
   ```

3. **طابق الشكل مع المحتوى الحقيقي**
   ```tsx
   // إذا المحتوى 3 بطاقات، استخدم 3 skeletons
   {
     loading ? (
       <>
         <StatCardSkeleton />
         <StatCardSkeleton />
         <StatCardSkeleton />
       </>
     ) : (
       <ActualContent />
     );
   }
   ```

---

## الخلاصة

**Skeleton Components** تحسن تجربة المستخدم بشكل كبير:

- ✅ تجعل التطبيق يبدو أسرع
- ✅ تقلل القلق عند المستخدم
- ✅ مظهر احترافي
- ✅ سهلة الاستخدام

**استخدمها في كل مكان يحتاج تحميل بيانات!** 🚀

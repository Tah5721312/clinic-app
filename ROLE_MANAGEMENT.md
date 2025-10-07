# إدارة الأدوار والصلاحيات في التطبيق

## نظرة عامة

يستخدم التطبيق نظام إدارة أدوار متقدم يعتمد على مكتبة CASL للتحكم في الصلاحيات. هذا النظام يسمح بتحديد ما يمكن لكل مستخدم رؤيته والقيام به بناءً على دوره.

## الأدوار المتاحة

### 1. Superadmin (سوبر أدمن)

- **الصلاحيات:** جميع الصلاحيات على جميع الموارد
- **الوصف:** يمكنه إدارة كل شيء في النظام

### 2. Admin (أدمن)

- **الصلاحيات:**
  - إدارة المستخدمين (`manage User`)
  - إدارة المرضى (`manage Patient`)
  - إدارة الأطباء (`manage Doctor`)
  - إدارة المواعيد (`manage Appointment`)
  - قراءة لوحة التحكم (`read Dashboard`)

### 3. Doctor (طبيب)

- **الصلاحيات:**
  - قراءة وتحديث بياناته (`read`, `update Doctor`)
  - قراءة بيانات المرضى (`read Patient`)
  - إدارة المواعيد (`read`, `update`, `create Appointment`)
  - قراءة لوحة التحكم (`read Dashboard`)

### 4. Patient (مريض)

- **الصلاحيات:**
  - قراءة بياناته (`read Patient`)
  - إدارة مواعيده (`read`, `create Appointment`)

## كيفية إضافة صلاحيات جديدة

### 1. تحديث أنواع الصلاحيات

في ملف `src/lib/ability.ts`:

```typescript
export type Actions =
  | 'manage'
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'newAction';
export type Subjects =
  | 'User'
  | 'Patient'
  | 'Doctor'
  | 'Appointment'
  | 'Dashboard'
  | 'NewSubject';
```

### 2. إضافة قواعد جديدة

في دالة `defineAbilityRulesFor`:

```typescript
case 'doctor':
  rules.push({ action: 'newAction', subject: 'NewSubject' });
  break;
```

### 3. استخدام الصلاحيات في المكونات

```tsx
<Can do='newAction' on='NewSubject'>
  <div>محتوى يظهر فقط للمستخدمين الذين لديهم هذه الصلاحية</div>
</Can>
```

## كيفية التحقق من الصلاحيات برمجياً

### في Server Components

```typescript
import { getRoleInfo } from '@/lib/roleManager';

const roleInfo = await getRoleInfo();
if (roleInfo.canAccessDashboard) {
  // عرض محتوى لوحة التحكم
}
```

### في Client Components

```tsx
import { useAbility } from '@/contexts/AbilityContext';

const ability = useAbility();
if (ability.can('read', 'Dashboard')) {
  // عرض محتوى لوحة التحكم
}
```

## إضافة دور جديد

### 1. تحديث نوع الدور

```typescript
export type Role = 'superadmin' | 'admin' | 'doctor' | 'patient' | 'newRole';
```

### 2. إضافة قواعد الدور الجديد

```typescript
case 'newRole':
  rules.push({ action: 'read', subject: 'Patient' });
  rules.push({ action: 'create', subject: 'Appointment' });
  break;
```

### 3. تحديث التحقق من الأدوار

في ملفات الحماية، أضف الدور الجديد:

```typescript
if (role !== 'superadmin' && role !== 'admin' && role !== 'newRole') {
  redirect('/');
}
```

## نصائح مهمة

1. **الأمان:** دائماً تحقق من الصلاحيات في Server Components قبل عرض البيانات الحساسة
2. **الأداء:** استخدم `useMemo` في `AbilityProvider` لتجنب إعادة إنشاء القدرات في كل render
3. **التشخيص:** استخدم `RoleDebugger` component لفهم الصلاحيات الحالية للمستخدم
4. **الاختبار:** تأكد من اختبار جميع الأدوار والصلاحيات قبل النشر

## أمثلة عملية

### إخفاء/إظهار أزرار حسب الدور

```tsx
<Can do="manage" on="User">
  <button>إدارة المستخدمين</button>
</Can>

<Can do="read" on="Dashboard">
  <button>لوحة التحكم</button>
</Can>
```

### التحقق من الصلاحيات في API Routes

```typescript
import { getRoleFromCookies } from '@/lib/roleManager';

export async function GET() {
  const role = await getRoleFromCookies();

  if (role !== 'admin' && role !== 'superadmin') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // منطق API
}
```

### عرض رسائل مختلفة حسب الدور

```tsx
<Can do="manage" on="User">
  <div className="text-green-600">مرحباً أيها الأدمن!</div>
</Can>

<Can do="read" on="Doctor">
  <div className="text-blue-600">مرحباً دكتور!</div>
</Can>

<Can do="read" on="Patient">
  <div className="text-yellow-600">مرحباً مريض!</div>
</Can>
```

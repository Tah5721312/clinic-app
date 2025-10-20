import { AbilityBuilder, PureAbility } from '@casl/ability';

// تعريف الأدوار
export type Role = 'superadmin' | 'admin' | 'doctor' | 'patient' | 'guest';

// تعريف الصلاحيات
export type Actions = 'manage' | 'read' | 'create' | 'update' | 'delete';
export type Subjects = 'User' | 'Patient' | 'Doctor' | 'Appointment' | 'Dashboard' | 'INVOICES' | 'all';

export type AppAbility = PureAbility<[Actions, Subjects]>;

// تعريف قاعدة الصلاحيات ككائن قابل للتسلسل
export interface AbilityRule {
  action: Actions;
  subject: Subjects;
  // Optional list of allowed fields for field-level authorization
  fields?: string | string[];
  conditions?: any;
}

// دالة لتحديد قواعد الصلاحيات حسب الدور
export function defineAbilityRulesFor(role: Role): AbilityRule[] {
  const rules: AbilityRule[] = [];

  switch (role) {
    case 'superadmin':
      // السوبر أدمن يملك كل الصلاحيات
      rules.push({ action: 'manage', subject: 'all' });
      break;

    case 'admin':
      // الأدمن يستطيع إدارة المستخدمين والمرضى والأطباء
      rules.push({ action: 'manage', subject: 'User' });
      rules.push({ action: 'manage', subject: 'Patient' });
      rules.push({ action: 'manage', subject: 'Doctor' });
      rules.push({ action: 'read', subject: 'Dashboard' });
      rules.push({ action: 'manage', subject: 'Appointment' });
      // invoices
      rules.push({ action: 'manage', subject: 'INVOICES' });
      break;

    case 'doctor':
      // الطبيب يستطيع قراءة وتحديث بياناته
      rules.push({ action: 'read', subject: 'Doctor' });
      rules.push({ action: 'update', subject: 'Doctor' });
      rules.push({ action: 'read', subject: 'Patient' });
      rules.push({ action: 'read', subject: 'Appointment' });
      rules.push({ action: 'update', subject: 'Appointment' });
      rules.push({ action: 'create', subject: 'Appointment' });
      rules.push({ action: 'read', subject: 'Dashboard' }); // إضافة صلاحية قراءة Dashboard للطبيب
      rules.push({ action: 'read', subject: 'INVOICES' });
      break;

    case 'patient':
      // المريض يستطيع قراءة بياناته فقط
      rules.push({ action: 'read', subject: 'Patient' });
      rules.push({ action: 'read', subject: 'Appointment' });
      rules.push({ action: 'create', subject: 'Appointment' });
      rules.push({ action: 'read', subject: 'INVOICES' });
      break;

    case 'guest':
      // الضيف يستطيع قراءة البيانات العامة فقط
      rules.push({ action: 'read', subject: 'Doctor' });
      rules.push({ action: 'read', subject: 'Appointment' });
      break;

    default:
      // لا صلاحيات للمستخدم غير المسجل
      break;
  }

  return rules;
}

// دالة لإنشاء Ability من القواعد
export function createAbilityFromRules(rules: AbilityRule[]): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(PureAbility);

  rules.forEach(rule => {
    if (rule.fields) {
      // fields then optional conditions
      (can as unknown as (
        action: Actions,
        subject: Subjects,
        fields?: string | string[],
        conditions?: any
      ) => void)(rule.action, rule.subject, rule.fields, rule.conditions);
    } else if (rule.conditions) {
      can(rule.action, rule.subject, rule.conditions);
    } else {
      can(rule.action, rule.subject);
    }
  });

  return build({
    fieldMatcher: (fields: string | string[]) => {
      if (!fields) return true;
      
      const fieldsArray = Array.isArray(fields) ? fields : [fields];
      
      // For now, allow all fields - this can be customized based on specific rules
      return fieldsArray.length > 0;
    }
  } as any);
}

// دالة لتحديد الصلاحيات حسب الدور (للخلفية)
export function defineAbilityFor(role: Role): AppAbility {
  const rules = defineAbilityRulesFor(role);
  return createAbilityFromRules(rules);
}

// Note: DB-backed ability helpers live in server-only module ability.server.ts
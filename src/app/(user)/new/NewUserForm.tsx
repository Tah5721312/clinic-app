"use client";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ButtonSpinner from "@/components/ButtonSpinner";
import { useRouter } from "next/navigation";
import { EyeSlashIcon, EyeIcon } from "@heroicons/react/24/solid";

interface Role {
  ROLE_ID: number;
  NAME: string;
  DESCRIPTION?: string;
  IS_ACTIVE?: number;
}

const NewUserForm = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [passwordShown, setPasswordShown] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  const togglePasswordVisiblity = () => setPasswordShown((cur) => !cur);

  // Reset form to ensure clean state
  const resetForm = () => {
    setUsername("");
    setEmail("");
    setFullName("");
    setPassword("");
    setRoleId(0);
    setPasswordShown(false);
  };

  // Reset form on component mount to ensure clean state
  useEffect(() => {
    resetForm();
  }, []);

  // Fetch roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/roles');
        const data = await response.json();
        if (data.roles) {
          setRoles(data.roles);
          // Don't set any default role - let user choose
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast.error('فشل في تحميل الأدوار');
      }
    };

    fetchRoles();
  }, []);

  const formSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username === "") return toast.error("اسم المستخدم مطلوب");
    if (email === "") return toast.error("البريد الإلكتروني مطلوب");
    if (fullName === "") return toast.error("الاسم الكامل مطلوب");
    if (password === "") return toast.error("كلمة المرور مطلوبة");
    if (roleId === 0) return toast.error("الدور الوظيفي مطلوب");

    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          fullName,
          password,
          roleId,
        }),
      });

      if (response.ok) {
        toast.success("تم إنشاء المستخدم بنجاح");
        router.push("/Dashboard"); // Redirect to dashboard after successful creation
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "فشل في إنشاء المستخدم");
      }
    } catch (error: any) {
      toast.error("حدث خطأ أثناء إنشاء المستخدم");
      console.error(error?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid text-center items-center">
      <div>
        <h3 className="text-3xl font-bold text-blue-gray-800 mb-2">
          إضافة مستخدم جديد
        </h3>
        <p className="mb-8 text-gray-600 font-normal text-[18px]">
          أدخل تفاصيل المستخدم الجديد
        </p>
        <form onSubmit={formSubmitHandler} className="mx-auto max-w-[24rem] text-left" autoComplete="off">
          <div className="mb-6">
            <label htmlFor="username" className="mb-2 block font-medium text-gray-900 text-sm">
              اسم المستخدم
            </label>
            <input
              id="username"
              className="w-full px-3 py-2.5 border border-blue-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              type="text"
              placeholder="اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="fullName" className="mb-2 block font-medium text-gray-900 text-sm">
              الاسم الكامل
            </label>
            <input
              id="fullName"
              className="w-full px-3 py-2.5 border border-blue-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              type="text"
              placeholder="الاسم الكامل"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="email" className="mb-2 block font-medium text-gray-900 text-sm">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              className="w-full px-3 py-2.5 border border-blue-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              type="email"
              placeholder="name@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="role" className="mb-2 block font-medium text-gray-900 text-sm">
              الدور الوظيفي
            </label>
            <select
              id="role"
              className="w-full px-3 py-2.5 border border-blue-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              value={roleId}
              onChange={(e) => setRoleId(parseInt(e.target.value))}
            >
              <option value={0}>اختر الدور</option>
              {roles.map((role) => (
                <option key={role.ROLE_ID} value={role.ROLE_ID}>
                  {role.NAME}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="mb-2 block font-medium text-gray-900 text-sm">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                id="password"
                className="w-full px-3 py-2.5 border border-blue-gray-200 rounded-lg focus:border-blue-500 focus:outline-none pr-10"
                type={passwordShown ? "text" : "password"}
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              <button
                type="button"
                onClick={togglePasswordVisiblity}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {passwordShown ? (
                  <EyeIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <ButtonSpinner /> : "إنشاء مستخدم"}
          </button>

          <p className="mt-4 text-gray-600 text-sm text-center">
            <a href="/Dashboard" className="font-medium text-gray-900 hover:text-blue-600">
              العودة إلى لوحة التحكم
            </a>
          </p>
        </form>
      </div>
    </section>
  );
};

export default NewUserForm;

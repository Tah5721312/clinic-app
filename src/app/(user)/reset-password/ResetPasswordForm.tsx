"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { DOMAIN } from "@/lib/constants";

const ResetPasswordForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error("Please enter email and password");
    }
    try {
      setLoading(true);
      await axios.post(`${DOMAIN}/api/users/reset-password`, { email, password });
      toast.success("Password updated");
      setEmail("");
      setPassword("");
      // ✅ تحويل المستخدم لصفحة تسجيل الدخول
      setTimeout(() => router.push("/login"), 1500);// تأخير بسيط عشان تظهر رسالة التوست
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid text-center items-center min-h-[80vh]">
      <div>
        <h3 className="text-3xl font-bold text-blue-gray-800 mb-4">Reset Password</h3>
        <form onSubmit={handleSubmit} className="mx-auto max-w-[24rem] text-left space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              className="w-full px-3 py-2.5 border border-blue-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="password"
              className="w-full px-3 py-2.5 border border-blue-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ResetPasswordForm;
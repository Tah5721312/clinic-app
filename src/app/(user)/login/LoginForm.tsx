"use client";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import axios from "axios";
import { DOMAIN } from "@/lib/constants";
import ButtonSpinner from "@/components/ButtonSpinner";
import { EyeSlashIcon, EyeIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

const LoginForm = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordShown, setPasswordShown] = useState(false);
  const togglePasswordVisiblity = () => setPasswordShown((cur) => !cur);

  
  const formSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "") return toast.error("Email is required");
    if (password === "") return toast.error("Password is required");

    try {
      setLoading(true);
      await axios.post(`${DOMAIN}/api/users/login`, { email, password });
      // await axios.post(`/api/users/login`, { email, password });
      setLoading(false);
      router.replace("/");
      // router.refresh();
      toast.success("Login successful");
    } catch (error: any) {
      toast.error(error?.response?.data.message);
      console.log(error);
      setLoading(false);
    }
  };

  return (
    <section className="grid text-center items-center">
      <div>
        <h3 className="text-3xl font-bold text-blue-gray-800 mb-2">
          Sign In
        </h3>
        <p className="mb-8 text-gray-600 font-normal text-[18px]">
          Enter your email and password to sign in
        </p>
        <form onSubmit={formSubmitHandler} className="mx-auto max-w-[24rem] text-left">
          <div className="mb-6">
            <label htmlFor="email" className="mb-2 block font-medium text-gray-900 text-sm">
              Your Email
            </label>
            <input
              id="email"
              className="w-full px-3 py-2.5 border border-blue-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              type="email"
              name="email"
              placeholder="name@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="mb-2 block font-medium text-gray-900 text-sm">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                className="w-full px-3 py-2.5 border border-blue-gray-200 rounded-lg focus:border-blue-500 focus:outline-none pr-10"
                type={passwordShown ? "text" : "password"}
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {loading ? <ButtonSpinner /> : "Login"}
          </button>
          
          <div className="mt-4 flex justify-end">
            <a
              href="/reset-password"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Forgot password
            </a>
          </div>
          <button
            type="button"
            className="mt-6 w-full h-12 flex items-center justify-center gap-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Image
              src="/logo-google.png"
              alt="google"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            sign in with google
          </button>
          <p className="mt-4 text-gray-600 text-sm text-center">
            Not registered?{" "}
            <a href="/register" className="font-medium text-gray-900 hover:text-blue-600">
              Create account
            </a>
          </p>
        </form>
      </div>
    </section>
  );
};

export default LoginForm;
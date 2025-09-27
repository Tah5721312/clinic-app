"use client";
import React, { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { DOMAIN } from "@/lib/constants";
import ButtonSpinner from "@/components/ButtonSpinner";
import { useRouter } from "next/navigation";
import { EyeSlashIcon, EyeIcon } from "@heroicons/react/24/solid";

const RegisterForm = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordShown, setPasswordShown] = useState(false);
  const togglePasswordVisiblity = () => setPasswordShown((cur) => !cur);

  const formSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "") return toast.error("Username is required");
    if (email === "") return toast.error("Email is required");
    if (password === "") return toast.error("Password is required");

    try {
      setLoading(true);
      await axios.post(`${DOMAIN}/api/users/register`, {
        email,
        password,
        username,
      });
      router.replace("/");
      setLoading(false);
      // router.refresh();
      toast.success("Registration successful");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Registration failed");
      console.error(error?.message);

      setLoading(false);
    }
  };

  return (
    <section className="grid text-center items-center">
      <div>
        <h3 className="text-3xl font-bold text-blue-gray-800 mb-2">
          Create Account
        </h3>
        <p className="mb-8 text-gray-600 font-normal text-[18px]">
          Enter your details to register
        </p>
        <form onSubmit={formSubmitHandler} className="mx-auto max-w-[24rem] text-left">
          <div className="mb-6">
            <label htmlFor="username" className="mb-2 block font-medium text-gray-900 text-sm">
              Username
            </label>
            <input
              id="username"
              className="w-full px-3 py-2.5 border border-blue-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              type="text"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="email" className="mb-2 block font-medium text-gray-900 text-sm">
              Email
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
            {loading ? <ButtonSpinner /> : "Register"}
          </button>

          <p className="mt-4 text-gray-600 text-sm text-center">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-gray-900 hover:text-blue-600">
              Sign In
            </a>
          </p>
        </form>
      </div>
    </section>
  );
};

export default RegisterForm;
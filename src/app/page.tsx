"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8">
        <Image
          src="/wfc-logo.jpg"
          alt="Wachagga Family Community Logo"
          width={220}
          height={220}
          className="rounded-full shadow-lg"
          priority
        />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-black mb-1">
          Karibu kwenye WFC Portal
        </h1>
        <p className="text-center text-gray-600 text-sm mb-8">
          Umoja wa Wachagga, Nguvu ya Familia
        </p>

        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Barua pepe / Namba ya Simu
            </label>
            <input
              type="text"
              placeholder="mfano: mwanachama@wfc.or.tz"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nenosiri
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Weka nenosiri lako"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? "Ficha" : "Onyesha"}
              </button>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="w-full bg-[#ff6b00] hover:bg-[#e55a00] text-white font-semibold py-3.5 rounded-xl transition-colors duration-200 shadow-md text-center block"
          >
            Ingia
          </Link>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Huna akaunti?{" "}
          <Link href="/register" className="text-[#ff6b00] font-medium hover:underline">
            Jisajili hapa
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Stand up · It's not over
          </p>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400">
        © {new Date().getFullYear()} Wachagga Family Community. Haki zote zimehifadhiwa.
      </p>
    </div>
  );
}

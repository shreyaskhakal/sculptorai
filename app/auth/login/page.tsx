"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Lock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Smooth login transition to dashboard
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#07080C] text-[#E2E6F2] flex items-center justify-center p-6 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-r from-[#F5792A]/10 via-[#00E5FF]/10 to-transparent blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#0D1018] border border-[#212739] rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#F5792A] to-[#E0681B] flex items-center justify-center text-white shadow-glow-orange">
              <Box className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-white">
              SCULPTOR<span className="text-[#F5792A]">AI</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-white">Welcome back</h2>
          <p className="text-xs text-[#7A86A1] mt-1">
            Sign in to continue building your Blender scenes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#CCD2E3] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#606D85] absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="artist@studio.com"
                required
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#141825] border border-[#23293D] text-white text-xs focus:outline-none focus:border-[#F5792A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#CCD2E3] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#606D85] absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#141825] border border-[#23293D] text-white text-xs focus:outline-none focus:border-[#F5792A]"
              />
            </div>
          </div>

          <Button
            type="submit"
            size="md"
            variant="primary"
            isLoading={isLoading}
            className="w-full font-semibold text-xs py-2.5 shadow-glow-orange mt-2"
          >
            <span>Sign In to SculptorAI</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="text-center mt-6 text-xs text-[#7A86A1]">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-[#F5792A] hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

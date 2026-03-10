"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Page } from "konsta/react";
import { useAuth } from "@/hooks/useAuth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setLoading(true);

    const { error } = await resetPassword(email);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Page>
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          <div className="text-5xl mb-6">📬</div>
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-gray-400 mt-3 text-center text-[15px] max-w-xs">
            We sent a password reset link to <span className="font-medium text-gray-600">{email}</span>
          </p>
          <button
            className="mt-8 w-full max-w-sm py-3.5 rounded-xl bg-blue-500 text-white font-semibold text-[16px] active:scale-[0.98] transition-all"
            onClick={() => router.push("/login")}
          >
            Back to Login
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex flex-col justify-center min-h-screen px-6 py-12">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🔑</div>
          <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
          <p className="text-gray-400 mt-2 text-[15px]">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <form onSubmit={handleReset} className="w-full max-w-sm mx-auto">
          <div className="mb-6">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-[16px] placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 text-center text-sm mb-4 bg-red-50 rounded-xl py-2.5 px-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-semibold text-[16px] disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-500">
          Remember your password?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-blue-500 font-semibold"
          >
            Sign In
          </button>
        </p>
      </div>
    </Page>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Page } from "konsta/react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signInWithEmail(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Middleware will redirect to /native-lang or /decks based on onboarding status
      router.push("/decks");
      router.refresh();
    }
  };

  return (
    <Page>
      <div className="flex flex-col justify-center min-h-screen px-6 py-12">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">📖</div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-gray-400 mt-2 text-[15px]">Sign in to continue learning</p>
        </div>

        <form onSubmit={handleLogin} className="w-full max-w-sm mx-auto">
          <div className="space-y-3 mb-6">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-[16px] placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-[16px] placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 text-center text-sm mb-4 bg-red-50 rounded-xl py-2.5 px-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-semibold text-[16px] disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => router.push("/signup")}
            className="text-blue-500 font-semibold"
          >
            Sign Up
          </button>
        </p>
      </div>
    </Page>
  );
}

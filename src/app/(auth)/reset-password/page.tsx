"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Page } from "konsta/react";
import { useAuth } from "@/hooks/useAuth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Page>
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          <div className="text-5xl mb-6">✅</div>
          <h1 className="text-2xl font-bold tracking-tight">Password updated</h1>
          <p className="text-gray-400 mt-3 text-center text-[15px] max-w-xs">
            Your password has been successfully changed.
          </p>
          <button
            className="mt-8 w-full max-w-sm py-3.5 rounded-xl bg-blue-500 text-white font-semibold text-[16px] active:scale-[0.98] transition-all"
            onClick={() => router.push("/decks")}
          >
            Continue to App
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex flex-col justify-center min-h-screen px-6 py-12">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold tracking-tight">New Password</h1>
          <p className="text-gray-400 mt-2 text-[15px]">Choose a new password for your account</p>
        </div>

        <form onSubmit={handleUpdate} className="w-full max-w-sm mx-auto">
          <div className="space-y-3 mb-6">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-[16px] placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-[16px] placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 text-center text-sm mb-4 bg-red-50 rounded-xl py-2.5 px-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-semibold text-[16px] disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </Page>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

const IOS_STEPS = [
  {
    icon: (
      <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25" />
      </svg>
    ),
    text: "Tap the Share button in Safari",
  },
  {
    icon: (
      <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
    text: "Scroll down and tap \"Add to Home Screen\"",
  },
  {
    icon: (
      <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    text: "Tap \"Add\" to confirm",
  },
];

const ANDROID_STEPS = [
  {
    icon: (
      <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
      </svg>
    ),
    text: "Tap the menu icon (three dots) in Chrome",
  },
  {
    icon: (
      <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3" />
      </svg>
    ),
    text: "Tap \"Add to Home screen\"",
  },
  {
    icon: (
      <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    text: "Tap \"Install\" to confirm",
  },
];

export default function AddToHomescreenPage() {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>("other");
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setAlreadyInstalled(isStandalone());
  }, []);

  const steps = platform === "ios" ? IOS_STEPS : ANDROID_STEPS;

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-28">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-[22px] bg-blue-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 18.75h6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Welcome to Vocafast!
            </h1>
            <p className="text-gray-400 text-[15px] leading-relaxed">
              For the best experience, add Vocafast to your home screen
            </p>
          </div>

          {/* Already installed */}
          {alreadyInstalled ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 rounded-2xl p-5 border border-green-100 text-center mb-6"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="font-semibold text-green-700 text-[15px]">Already installed!</p>
              <p className="text-green-600 text-[13px] mt-1">Vocafast is on your home screen</p>
            </motion.div>
          ) : (
            <>
              {/* Install steps */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
                <AnimatePresence>
                  {steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.1 }}
                      className={`flex items-center gap-4 px-5 py-3.5 ${
                        i < steps.length - 1 ? "border-b border-gray-100" : ""
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-500 font-bold text-[14px]">{i + 1}</span>
                      </div>
                      <p className="text-[14px] text-gray-700 font-medium flex-1">{step.text}</p>
                      <div className="flex-shrink-0">{step.icon}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {platform === "other" && (
                <p className="text-[13px] text-gray-400 text-center mb-4">
                  Use your browser&apos;s menu to add this app to your home screen
                </p>
              )}
            </>
          )}

          {/* Benefits */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Why add to home screen?</p>
            <div className="space-y-2">
              {[
                { icon: "🚀", text: "Instant access — launch like a native app" },
                { icon: "📱", text: "Full-screen experience — no browser bars" },
                { icon: "🔔", text: "Stay on track with daily reminders" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <p className="text-[13px] text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sticky bottom button */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-gradient-to-t from-white via-white to-white/0">
        <button
          onClick={() => router.push("/native-lang")}
          className="w-full py-3.5 rounded-2xl bg-blue-500 text-white font-semibold text-[16px] active:scale-[0.98] transition-transform"
        >
          Continue
        </button>
        <button
          onClick={() => router.push("/native-lang")}
          className="w-full mt-2 py-2.5 text-gray-400 font-medium text-[14px]"
        >
          I&apos;ll do it later
        </button>
      </div>
    </div>
  );
}

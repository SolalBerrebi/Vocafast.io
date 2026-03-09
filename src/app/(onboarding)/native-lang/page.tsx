"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "he", name: "Hebrew", flag: "🇮🇱" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "sv", name: "Swedish", flag: "🇸🇪" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
];

export default function NativeLangPage() {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!selected) return;
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ native_lang: selected })
      .eq("id", user.id);

    router.push("/target-lang");
  };

  return (
    <div className="px-5 pt-6 pb-8">
      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        <div className="flex-1 h-1 rounded-full bg-blue-500" />
        <div className="flex-1 h-1 rounded-full bg-gray-200" />
        <div className="flex-1 h-1 rounded-full bg-gray-200" />
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight">What&apos;s your native language?</h1>
        <p className="text-gray-400 mt-2 text-[15px]">
          This helps us provide better translations
        </p>
      </div>

      <div className="space-y-1.5 mb-8">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setSelected(lang.code)}
            className={`w-full px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all ${
              selected === lang.code
                ? "bg-blue-50 border-2 border-blue-500"
                : "bg-white border-2 border-gray-100 active:bg-gray-50"
            }`}
          >
            <span className="text-xl">{lang.flag}</span>
            <span className={`font-medium text-[15px] ${
              selected === lang.code ? "text-blue-600" : "text-gray-800"
            }`}>{lang.name}</span>
            {selected === lang.code && (
              <svg className="w-5 h-5 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={!selected || loading}
        className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-semibold text-[16px] disabled:opacity-50 active:scale-[0.98] transition-all"
      >
        {loading ? "Saving..." : "Continue"}
      </button>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEnvironment } from "@/hooks/useEnvironment";

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧", icon: "🇬🇧" },
  { code: "he", name: "Hebrew", flag: "🇮🇱", icon: "🇮🇱" },
  { code: "fr", name: "French", flag: "🇫🇷", icon: "🇫🇷" },
  { code: "es", name: "Spanish", flag: "🇪🇸", icon: "🇪🇸" },
  { code: "ar", name: "Arabic", flag: "🇸🇦", icon: "🇸🇦" },
  { code: "de", name: "German", flag: "🇩🇪", icon: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹", icon: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹", icon: "🇵🇹" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", icon: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷", icon: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", icon: "🇨🇳" },
  { code: "ru", name: "Russian", flag: "🇷🇺", icon: "🇷🇺" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", icon: "🇮🇳" },
  { code: "nl", name: "Dutch", flag: "🇳🇱", icon: "🇳🇱" },
  { code: "sv", name: "Swedish", flag: "🇸🇪", icon: "🇸🇪" },
  { code: "pl", name: "Polish", flag: "🇵🇱", icon: "🇵🇱" },
  { code: "tr", name: "Turkish", flag: "🇹🇷", icon: "🇹🇷" },
];

export default function TargetLangPage() {
  const router = useRouter();
  const { createEnvironment } = useEnvironment();
  const [selected, setSelected] = useState("");
  const [nativeLang, setNativeLang] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("native_lang")
        .eq("id", user.id)
        .single();
      if (data) setNativeLang(data.native_lang);
    };
    fetchProfile();
  }, []);

  const availableLanguages = LANGUAGES.filter((l) => l.code !== nativeLang);

  const handleNext = async () => {
    if (!selected) return;
    setLoading(true);

    const lang = LANGUAGES.find((l) => l.code === selected);
    await createEnvironment(selected, "#007AFF", lang?.icon ?? "🌍");

    router.push("/first-deck");
  };

  return (
    <div className="px-5 pt-6 pb-8">
      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        <div className="flex-1 h-1 rounded-full bg-blue-500" />
        <div className="flex-1 h-1 rounded-full bg-blue-500" />
        <div className="flex-1 h-1 rounded-full bg-gray-200" />
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight">What language do you want to learn?</h1>
        <p className="text-gray-400 mt-2 text-[15px]">
          You can add more languages later
        </p>
      </div>

      <div className="space-y-1.5 mb-8">
        {availableLanguages.map((lang) => (
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
        {loading ? "Setting up..." : "Continue"}
      </button>
    </div>
  );
}

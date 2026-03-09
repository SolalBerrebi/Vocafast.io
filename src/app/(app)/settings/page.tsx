"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  List,
  ListItem,
  Sheet,
  Radio,
} from "konsta/react";
import { useAuth } from "@/hooks/useAuth";
import { useEnvironment } from "@/hooks/useEnvironment";
import { getLangName } from "@/components/ui/EnvSwitcher";

const LANGUAGES = [
  { code: "en", name: "English", icon: "🇬🇧" },
  { code: "he", name: "Hebrew", icon: "🇮🇱" },
  { code: "fr", name: "French", icon: "🇫🇷" },
  { code: "es", name: "Spanish", icon: "🇪🇸" },
  { code: "ar", name: "Arabic", icon: "🇸🇦" },
  { code: "de", name: "German", icon: "🇩🇪" },
  { code: "it", name: "Italian", icon: "🇮🇹" },
  { code: "pt", name: "Portuguese", icon: "🇵🇹" },
  { code: "ja", name: "Japanese", icon: "🇯🇵" },
  { code: "ko", name: "Korean", icon: "🇰🇷" },
  { code: "zh", name: "Chinese", icon: "🇨🇳" },
  { code: "ru", name: "Russian", icon: "🇷🇺" },
  { code: "hi", name: "Hindi", icon: "🇮🇳" },
  { code: "nl", name: "Dutch", icon: "🇳🇱" },
  { code: "sv", name: "Swedish", icon: "🇸🇪" },
  { code: "pl", name: "Polish", icon: "🇵🇱" },
  { code: "tr", name: "Turkish", icon: "🇹🇷" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { environments, createEnvironment } = useEnvironment();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const existingCodes = new Set(environments.map((e) => e.target_lang));
  const availableLanguages = LANGUAGES.filter((l) => !existingCodes.has(l.code));

  const handleAddLanguage = async () => {
    if (!selectedLang) return;
    setAdding(true);
    const lang = LANGUAGES.find((l) => l.code === selectedLang);
    await createEnvironment(selectedLang, "#007AFF", lang?.icon ?? "🌍");
    setAdding(false);
    setAddSheetOpen(false);
    setSelectedLang("");
  };

  return (
    <>
      <div className="px-5 pt-4 pb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-5">Settings</h1>

        {/* Account */}
        <div className="mb-6">
          <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">Account</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3.5 flex justify-between items-center">
              <span className="text-[15px] font-medium">Email</span>
              <span className="text-[14px] text-gray-400">{user?.email ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="mb-8">
          <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">Languages</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
            {environments.map((env) => (
              <div key={env.id} className="px-4 py-3.5 flex items-center gap-3">
                <span className="text-xl">{env.icon}</span>
                <span className="text-[15px] font-medium flex-1">{getLangName(env.target_lang)}</span>
                {env.is_active && (
                  <span className="text-[12px] font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Active</span>
                )}
              </div>
            ))}
            {availableLanguages.length > 0 && (
              <button
                className="w-full px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors"
                onClick={() => setAddSheetOpen(true)}
              >
                <span className="text-xl">➕</span>
                <span className="text-[15px] font-medium text-blue-500">Add Language</span>
              </button>
            )}
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full py-3.5 rounded-xl bg-red-50 text-red-500 font-semibold text-[16px] active:scale-[0.98] transition-all"
        >
          Sign Out
        </button>
      </div>

      {/* Add Language Sheet */}
      <Sheet
        opened={addSheetOpen}
        onBackdropClick={() => setAddSheetOpen(false)}
        className="pb-safe"
      >
        <div className="px-5 pt-4 pb-2 flex justify-between items-center">
          <button
            className="text-blue-500 text-[15px] font-medium"
            onClick={() => setAddSheetOpen(false)}
          >
            Cancel
          </button>
          <span className="font-semibold text-[16px]">Add Language</span>
          <button
            className={`text-[15px] font-semibold ${selectedLang ? "text-blue-500" : "text-gray-300"}`}
            onClick={handleAddLanguage}
            disabled={!selectedLang || adding}
          >
            {adding ? "Adding..." : "Add"}
          </button>
        </div>
        <List strongIos insetIos className="max-h-80 overflow-y-auto scrollbar-hide">
          {availableLanguages.map((lang) => (
            <ListItem
              key={lang.code}
              title={lang.name}
              media={<span className="text-xl">{lang.icon}</span>}
              after={
                <Radio
                  checked={selectedLang === lang.code}
                  onChange={() => setSelectedLang(lang.code)}
                />
              }
              onClick={() => setSelectedLang(lang.code)}
            />
          ))}
        </List>
      </Sheet>
    </>
  );
}

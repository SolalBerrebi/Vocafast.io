"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Navbar,
  List,
  ListItem,
  BlockTitle,
  Block,
  Button,
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

  // Filter out languages that already have an environment
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
      <Navbar title="Settings" />

      <BlockTitle>Account</BlockTitle>
      <List strongIos insetIos>
        <ListItem title="Email" after={user?.email ?? "—"} />
      </List>

      <BlockTitle>Language Environments</BlockTitle>
      <List strongIos insetIos>
        {environments.map((env) => (
          <ListItem
            key={env.id}
            title={getLangName(env.target_lang)}
            media={<span className="text-xl">{env.icon}</span>}
            after={env.is_active ? "Active" : ""}
          />
        ))}
        {availableLanguages.length > 0 && (
          <ListItem
            title="Add Language"
            link
            onClick={() => setAddSheetOpen(true)}
            media={<span className="text-xl">➕</span>}
          />
        )}
      </List>

      <Block className="mt-8">
        <Button large colors={{ fillBgIos: "bg-red-500", fillTextIos: "text-white" }} onClick={handleSignOut}>
          Sign Out
        </Button>
      </Block>

      {/* Add Language Sheet */}
      <Sheet
        opened={addSheetOpen}
        onBackdropClick={() => setAddSheetOpen(false)}
        className="pb-safe"
      >
        <div className="px-4 pt-4 pb-2 flex justify-between items-center">
          <button
            className="text-blue-500 text-sm font-medium"
            onClick={() => setAddSheetOpen(false)}
          >
            Cancel
          </button>
          <span className="font-semibold">Add Language</span>
          <button
            className={`text-sm font-semibold ${selectedLang ? "text-blue-500" : "text-gray-300"}`}
            onClick={handleAddLanguage}
            disabled={!selectedLang || adding}
          >
            {adding ? "Adding..." : "Add"}
          </button>
        </div>
        <List strongIos insetIos className="max-h-80 overflow-y-auto">
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

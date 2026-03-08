"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar, Block, Button, List, ListItem, Radio } from "konsta/react";
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
    <>
      <Navbar title="Step 2 of 3" />
      <Block className="text-center mt-4">
        <h1 className="text-2xl font-bold">What language do you want to learn?</h1>
        <p className="text-gray-500 mt-2">
          You can add more languages later
        </p>
      </Block>

      <List strongIos insetIos>
        {availableLanguages.map((lang) => (
          <ListItem
            key={lang.code}
            title={lang.name}
            media={<span className="text-xl">{lang.flag}</span>}
            after={
              <Radio
                checked={selected === lang.code}
                onChange={() => setSelected(lang.code)}
              />
            }
            onClick={() => setSelected(lang.code)}
          />
        ))}
      </List>

      <Block>
        <Button
          large
          onClick={handleNext}
          disabled={!selected || loading}
        >
          {loading ? "Setting up..." : "Continue"}
        </Button>
      </Block>
    </>
  );
}

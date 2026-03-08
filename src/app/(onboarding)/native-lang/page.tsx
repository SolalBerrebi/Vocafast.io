"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar, Block, Button, List, ListItem, Radio } from "konsta/react";
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
    <>
      <Navbar title="Step 1 of 3" />
      <Block className="text-center mt-4">
        <h1 className="text-2xl font-bold">What&apos;s your native language?</h1>
        <p className="text-gray-500 mt-2">
          This helps us provide better translations
        </p>
      </Block>

      <List strongIos insetIos>
        {LANGUAGES.map((lang) => (
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
          {loading ? "Saving..." : "Continue"}
        </Button>
      </Block>
    </>
  );
}

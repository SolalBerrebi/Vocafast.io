"use client";

import { usePathname, useRouter } from "next/navigation";
import { Page, Tabbar, TabbarLink, Icon } from "konsta/react";
import EnvSwitcher from "@/components/ui/EnvSwitcher";

function DecksIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-7 h-7 ${active ? "text-blue-500" : "text-gray-400"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  );
}

function ProgressIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-7 h-7 ${active ? "text-blue-500" : "text-gray-400"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-7 h-7 ${active ? "text-blue-500" : "text-gray-400"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show tabbar on fullscreen training pages
  const isTraining = pathname.startsWith("/train/");

  const isDecks = pathname.startsWith("/decks");
  const isProgress = pathname === "/progress";
  const isSettings = pathname === "/settings";

  if (isTraining) {
    return <>{children}</>;
  }

  return (
    <Page>
      <div className="flex items-center justify-center py-2 border-b border-gray-200 bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <EnvSwitcher />
      </div>

      <div className="pb-20">{children}</div>

      <Tabbar className="fixed bottom-0 left-0 right-0">
        <TabbarLink
          active={isDecks}
          onClick={() => router.push("/decks")}
          icon={<Icon ios={<DecksIcon active={isDecks} />} />}
          label="Decks"
        />
        <TabbarLink
          active={isProgress}
          onClick={() => router.push("/progress")}
          icon={<Icon ios={<ProgressIcon active={isProgress} />} />}
          label="Progress"
        />
        <TabbarLink
          active={isSettings}
          onClick={() => router.push("/settings")}
          icon={<Icon ios={<SettingsIcon active={isSettings} />} />}
          label="Settings"
        />
      </Tabbar>
    </Page>
  );
}

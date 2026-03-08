"use client";

import { useRouter } from "next/navigation";
import {
  Navbar,
  List,
  ListItem,
  ListGroup,
  BlockTitle,
  Block,
  Button,
} from "konsta/react";
import { useAuth } from "@/hooks/useAuth";
import { useEnvironment } from "@/hooks/useEnvironment";
import { getLangName } from "@/components/ui/EnvSwitcher";

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { environments } = useEnvironment();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
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
        <ListItem
          title="Add Language"
          link
          onClick={() => router.push("/settings?add=true")}
          media={<span className="text-xl">➕</span>}
        />
      </List>

      <Block className="mt-8">
        <Button large colors={{ fillBgIos: "bg-red-500", fillTextIos: "text-white" }} onClick={handleSignOut}>
          Sign Out
        </Button>
      </Block>
    </>
  );
}

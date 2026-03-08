"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Page,
  Navbar,
  Block,
  List,
  ListInput,
  Button,
  BlockTitle,
} from "konsta/react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signInWithEmail(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/decks");
    }
  };

  return (
    <Page>
      <Navbar title="Vocafast" />
      <Block className="text-center mt-8">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-gray-500 mt-2">Sign in to continue learning</p>
      </Block>

      <form onSubmit={handleLogin}>
        <List strongIos insetIos>
          <ListInput
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
          />
          <ListInput
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
          />
        </List>

        {error && (
          <Block className="text-red-500 text-center text-sm">{error}</Block>
        )}

        <Block>
          <Button large onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </Block>
      </form>

      <Block className="text-center">
        <BlockTitle>
          Don&apos;t have an account?{" "}
          <button
            onClick={() => router.push("/signup")}
            className="text-blue-500 underline"
          >
            Sign Up
          </button>
        </BlockTitle>
      </Block>
    </Page>
  );
}

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

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signUp(email, password, displayName);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Page>
        <Navbar title="Vocafast" />
        <Block className="text-center mt-16">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-gray-500 mt-2">
            We sent you a confirmation link. Please check your inbox.
          </p>
          <Button
            large
            className="mt-8"
            onClick={() => router.push("/login")}
          >
            Back to Login
          </Button>
        </Block>
      </Page>
    );
  }

  return (
    <Page>
      <Navbar title="Vocafast" />
      <Block className="text-center mt-8">
        <h1 className="text-3xl font-bold">Create Account</h1>
        <p className="text-gray-500 mt-2">Start your vocabulary journey</p>
      </Block>

      <form onSubmit={handleSignup}>
        <List strongIos insetIos>
          <ListInput
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDisplayName(e.target.value)
            }
          />
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
          <Button large onClick={handleSignup} disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </Block>
      </form>

      <Block className="text-center">
        <BlockTitle>
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-blue-500 underline"
          >
            Sign In
          </button>
        </BlockTitle>
      </Block>
    </Page>
  );
}

"use client";

import { Page } from "konsta/react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Page>{children}</Page>;
}

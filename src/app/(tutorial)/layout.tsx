"use client";

import { Page } from "konsta/react";

export default function TutorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Page>{children}</Page>;
}

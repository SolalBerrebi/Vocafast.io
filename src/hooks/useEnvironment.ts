"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useEnvironmentStore } from "@/stores/environment-store";
import type { LanguageEnvironment } from "@/types/database";

export function useEnvironment() {
  const supabase = createClient();
  const {
    activeEnvironmentId,
    environments,
    setActiveEnvironment,
    setEnvironments,
    addEnvironment,
    removeEnvironment,
  } = useEnvironmentStore();

  const activeEnvironment = environments.find(
    (e) => e.id === activeEnvironmentId,
  );

  const fetchEnvironments = useCallback(async () => {
    const { data } = await supabase
      .from("language_environments")
      .select("*")
      .order("created_at");
    if (data) setEnvironments(data as LanguageEnvironment[]);
  }, [supabase, setEnvironments]);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  const switchEnvironment = async (id: string) => {
    // Deactivate all, activate selected
    await supabase
      .from("language_environments")
      .update({ is_active: false })
      .neq("id", "");
    await supabase
      .from("language_environments")
      .update({ is_active: true })
      .eq("id", id);
    setActiveEnvironment(id);
  };

  const createEnvironment = async (
    targetLang: string,
    color?: string,
    icon?: string,
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data, error } = await supabase
      .from("language_environments")
      .insert({
        user_id: user.id,
        target_lang: targetLang,
        is_active: environments.length === 0,
        color: color ?? "#007AFF",
        icon: icon ?? "🌍",
      })
      .select()
      .single();

    if (data) {
      addEnvironment(data as LanguageEnvironment);
      if (environments.length === 0) setActiveEnvironment(data.id);
    }
    return { data, error };
  };

  const deleteEnvironment = async (id: string) => {
    const { error } = await supabase
      .from("language_environments")
      .delete()
      .eq("id", id);
    if (!error) removeEnvironment(id);
    return { error };
  };

  return {
    activeEnvironment,
    activeEnvironmentId,
    environments,
    fetchEnvironments,
    switchEnvironment,
    createEnvironment,
    deleteEnvironment,
  };
}

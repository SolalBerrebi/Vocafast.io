"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";

export interface NotificationPreferences {
  notifications_enabled: boolean;
  daily_goal_enabled: boolean;
  daily_goal_words: number;
  daily_goal_sessions: number;
  reminder_enabled: boolean;
  reminder_time: string; // "HH:MM"
  reminder_days: boolean[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  streak_reminder_enabled: boolean;
  streak_reminder_time: string;
  review_due_enabled: boolean;
  achievements_enabled: boolean;
  inactivity_nudge_enabled: boolean;
  inactivity_nudge_days: number;
}

const DEFAULT_PREFS: NotificationPreferences = {
  notifications_enabled: true,
  daily_goal_enabled: true,
  daily_goal_words: 20,
  daily_goal_sessions: 1,
  reminder_enabled: true,
  reminder_time: "09:00",
  reminder_days: [true, true, true, true, true, true, true],
  streak_reminder_enabled: true,
  streak_reminder_time: "20:00",
  review_due_enabled: true,
  achievements_enabled: true,
  inactivity_nudge_enabled: true,
  inactivity_nudge_days: 3,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPushPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchPrefs = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setPrefs({
          notifications_enabled: data.notifications_enabled,
          daily_goal_enabled: data.daily_goal_enabled,
          daily_goal_words: data.daily_goal_words,
          daily_goal_sessions: data.daily_goal_sessions,
          reminder_enabled: data.reminder_enabled,
          reminder_time: data.reminder_time?.slice(0, 5) ?? "09:00",
          reminder_days: data.reminder_days ?? DEFAULT_PREFS.reminder_days,
          streak_reminder_enabled: data.streak_reminder_enabled,
          streak_reminder_time: data.streak_reminder_time?.slice(0, 5) ?? "20:00",
          review_due_enabled: data.review_due_enabled,
          achievements_enabled: data.achievements_enabled,
          inactivity_nudge_enabled: data.inactivity_nudge_enabled,
          inactivity_nudge_days: data.inactivity_nudge_days,
        });
      }
      setLoading(false);
    };
    fetchPrefs();
  }, [user]);

  const updatePrefs = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      if (!user) return;
      const newPrefs = { ...prefs, ...updates };
      setPrefs(newPrefs);
      setSaving(true);

      const supabase = createClient();
      await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: user.id,
            ...newPrefs,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      setSaving(false);
    },
    [user, prefs],
  );

  const requestPushPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "denied" as NotificationPermission;
    const permission = await Notification.requestPermission();
    setPushPermission(permission);
    return permission;
  }, []);

  return { prefs, loading, saving, updatePrefs, pushPermission, requestPushPermission };
}

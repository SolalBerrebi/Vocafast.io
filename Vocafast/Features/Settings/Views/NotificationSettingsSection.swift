import SwiftUI

struct NotificationSettingsSection: View {
    @ObservedObject var viewModel: SettingsViewModel

    private var prefs: NotificationPreferences? {
        viewModel.notificationPrefs
    }

    private var isEnabled: Bool {
        prefs?.notificationsEnabled ?? false
    }

    var body: some View {
        Section(L("notif_title")) {
            Toggle(L("notif_enable"), isOn: Binding(
                get: { isEnabled },
                set: { newValue in Task { await viewModel.toggleNotifications(newValue) } }
            ))

            if isEnabled {
                // Daily Goal
                Toggle(L("notif_daily_goal"), isOn: binding(\.dailyGoalEnabled))

                if prefs?.dailyGoalEnabled == true {
                    Button(L("notif_edit_daily_goal")) {
                        viewModel.showDailyGoal = true
                    }
                }

                // Daily Reminder
                Toggle(L("notif_daily_reminder"), isOn: binding(\.reminderEnabled))

                if prefs?.reminderEnabled == true {
                    DatePicker(
                        L("notif_reminder_time"),
                        selection: timeBinding(\.reminderTime),
                        displayedComponents: .hourAndMinute
                    )
                }

                // Streak Reminder
                Toggle(L("notif_streak_reminder"), isOn: binding(\.streakReminderEnabled))

                if prefs?.streakReminderEnabled == true {
                    DatePicker(
                        L("notif_streak_time"),
                        selection: timeBinding(\.streakReminderTime),
                        displayedComponents: .hourAndMinute
                    )
                }

                // Review Due
                Toggle(L("notif_review_due"), isOn: binding(\.reviewDueEnabled))

                // Achievements
                Toggle(L("notif_achievements"), isOn: binding(\.achievementsEnabled))

                // Inactivity Nudge
                Toggle(L("notif_inactivity_nudge"), isOn: binding(\.inactivityNudgeEnabled))

                if prefs?.inactivityNudgeEnabled == true {
                    HStack {
                        Text(L("notif_after"))
                        Spacer()
                        Picker("", selection: inactivityDaysBinding) {
                            ForEach([2, 3, 5, 7], id: \.self) { d in
                                Text(LF("notif_days", d)).tag(d)
                            }
                        }
                        .pickerStyle(.menu)
                    }
                }
            }
        }
        .sheet(isPresented: $viewModel.showDailyGoal) {
            DailyGoalSheet(viewModel: viewModel)
        }
    }

    // MARK: - Bindings

    private func binding(_ keyPath: WritableKeyPath<NotificationPreferences, Bool>) -> Binding<Bool> {
        Binding(
            get: { viewModel.notificationPrefs?[keyPath: keyPath] ?? false },
            set: { newValue in
                viewModel.notificationPrefs?[keyPath: keyPath] = newValue
                Task { await viewModel.updateNotificationPrefs() }
            }
        )
    }

    private func timeBinding(_ keyPath: WritableKeyPath<NotificationPreferences, String>) -> Binding<Date> {
        Binding(
            get: {
                let timeStr = viewModel.notificationPrefs?[keyPath: keyPath] ?? "09:00"
                let parts = timeStr.split(separator: ":").compactMap { Int($0) }
                var comps = Calendar.current.dateComponents([.year, .month, .day], from: Date())
                comps.hour = parts.first ?? 9
                comps.minute = parts.count > 1 ? parts[1] : 0
                return Calendar.current.date(from: comps) ?? Date()
            },
            set: { newDate in
                let comps = Calendar.current.dateComponents([.hour, .minute], from: newDate)
                let timeStr = String(format: "%02d:%02d", comps.hour ?? 9, comps.minute ?? 0)
                viewModel.notificationPrefs?[keyPath: keyPath] = timeStr
                Task { await viewModel.updateNotificationPrefs() }
            }
        )
    }

    private var inactivityDaysBinding: Binding<Int> {
        Binding(
            get: { viewModel.notificationPrefs?.inactivityNudgeDays ?? 3 },
            set: { newValue in
                viewModel.notificationPrefs?.inactivityNudgeDays = newValue
                Task { await viewModel.updateNotificationPrefs() }
            }
        )
    }
}

private struct DailyGoalSheet: View {
    @ObservedObject var viewModel: SettingsViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(L("notif_words_per_day"))
                            Spacer()
                            Text("\(Int(viewModel.dailyGoalWords))")
                                .fontWeight(.semibold)
                        }
                        Slider(value: $viewModel.dailyGoalWords, in: 5...100, step: 5)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(L("notif_sessions_per_day"))
                            Spacer()
                            Text("\(Int(viewModel.dailyGoalSessions))")
                                .fontWeight(.semibold)
                        }
                        Slider(value: $viewModel.dailyGoalSessions, in: 1...5, step: 1)
                    }
                }
            }
            .navigationTitle(L("notif_daily_goal"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(L("common_save")) {
                        Task {
                            await viewModel.updateNotificationPrefs()
                            dismiss()
                        }
                    }
                }
            }
        }
        .presentationDetents([.medium])
    }
}

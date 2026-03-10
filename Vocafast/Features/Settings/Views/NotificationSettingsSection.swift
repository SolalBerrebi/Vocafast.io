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
        Section("Notifications") {
            Toggle("Enable Notifications", isOn: Binding(
                get: { isEnabled },
                set: { Task { await viewModel.toggleNotifications($0) } }
            ))

            if isEnabled {
                // Daily Goal
                Toggle("Daily Goal", isOn: binding(\.dailyGoalEnabled))

                if prefs?.dailyGoalEnabled == true {
                    Button("Edit Daily Goal") {
                        viewModel.showDailyGoal = true
                    }
                }

                // Daily Reminder
                Toggle("Daily Reminder", isOn: binding(\.reminderEnabled))

                // Streak Reminder
                Toggle("Streak Reminder", isOn: binding(\.streakReminderEnabled))

                // Review Due
                Toggle("Review Due Alerts", isOn: binding(\.reviewDueEnabled))

                // Achievements
                Toggle("Achievements", isOn: binding(\.achievementsEnabled))

                // Inactivity Nudge
                Toggle("Inactivity Nudge", isOn: binding(\.inactivityNudgeEnabled))
            }
        }
        .sheet(isPresented: $viewModel.showDailyGoal) {
            DailyGoalSheet(viewModel: viewModel)
        }
    }

    private func binding(_ keyPath: WritableKeyPath<NotificationPreferences, Bool>) -> Binding<Bool> {
        Binding(
            get: { viewModel.notificationPrefs?[keyPath: keyPath] ?? false },
            set: { newValue in
                viewModel.notificationPrefs?[keyPath: keyPath] = newValue
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
                            Text("Words per day")
                            Spacer()
                            Text("\(Int(viewModel.dailyGoalWords))")
                                .fontWeight(.semibold)
                        }
                        Slider(value: $viewModel.dailyGoalWords, in: 5...100, step: 5)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text("Sessions per day")
                            Spacer()
                            Text("\(Int(viewModel.dailyGoalSessions))")
                                .fontWeight(.semibold)
                        }
                        Slider(value: $viewModel.dailyGoalSessions, in: 1...5, step: 1)
                    }
                }
            }
            .navigationTitle("Daily Goal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
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

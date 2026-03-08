"use client";

interface StreakCalendarProps {
  activeDates: string[]; // ISO date strings (YYYY-MM-DD)
}

export default function StreakCalendar({ activeDates }: StreakCalendarProps) {
  const today = new Date();
  const activeSet = new Set(activeDates);

  // Show last 35 days (5 weeks)
  const days: { date: string; label: string; active: boolean }[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    days.push({
      date: iso,
      label: d.getDate().toString(),
      active: activeSet.has(iso),
    });
  }

  // Calculate current streak
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    if (activeSet.has(iso)) {
      streak++;
    } else if (i > 0) {
      // Allow today to be missed (might not have studied yet)
      break;
    }
  }

  return (
    <div>
      {streak > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🔥</span>
          <span className="font-bold text-lg">{streak} day streak</span>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1.5">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div
            key={i}
            className="text-center text-xs text-gray-400 font-medium pb-1"
          >
            {d}
          </div>
        ))}
        {days.map((day) => (
          <div
            key={day.date}
            className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
              day.active
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {day.label}
          </div>
        ))}
      </div>
    </div>
  );
}

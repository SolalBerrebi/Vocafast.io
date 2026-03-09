"use client";

interface StreakCalendarProps {
  activeDates: string[]; // ISO date strings (YYYY-MM-DD)
}

export default function StreakCalendar({ activeDates }: StreakCalendarProps) {
  const today = new Date();
  const activeSet = new Set(activeDates);

  // Show last 35 days (5 weeks)
  const days: { date: string; label: string; active: boolean; isToday: boolean }[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    days.push({
      date: iso,
      label: d.getDate().toString(),
      active: activeSet.has(iso),
      isToday: i === 0,
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
      break;
    }
  }

  return (
    <div>
      {streak > 0 && (
        <div className="flex items-center gap-2.5 mb-5">
          <span className="text-2xl">🔥</span>
          <div>
            <span className="font-bold text-lg tracking-tight">{streak} day streak</span>
            <p className="text-[12px] text-gray-400">Keep it up!</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1.5">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div
            key={i}
            className="text-center text-[11px] text-gray-400 font-semibold pb-1"
          >
            {d}
          </div>
        ))}
        {days.map((day) => (
          <div
            key={day.date}
            className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-medium transition-colors ${
              day.active
                ? "bg-green-500 text-white"
                : day.isToday
                  ? "bg-blue-50 text-blue-500 ring-1 ring-blue-200"
                  : "bg-gray-50 text-gray-400"
            }`}
          >
            {day.label}
          </div>
        ))}
      </div>
    </div>
  );
}

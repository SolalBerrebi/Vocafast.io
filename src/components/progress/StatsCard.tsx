"use client";

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: string;
}

export default function StatsCard({ label, value, icon }: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-lg">{icon}</span>
        <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

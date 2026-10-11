"use client";

import * as React from "react";
import { Bot, User } from "lucide-react";

interface ActivityPoint {
  time: string;
  ai: number;
  human: number;
}

interface ActivityChartProps {
  data: ActivityPoint[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  const chartData =
    data.length > 0
      ? data
      : [
          { time: "12am", ai: 12, human: 1 },
          { time: "4am", ai: 6, human: 0 },
          { time: "8am", ai: 45, human: 4 },
          { time: "12pm", ai: 89, human: 8 },
          { time: "4pm", ai: 110, human: 12 },
          { time: "8pm", ai: 78, human: 6 },
        ];

  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);

  const totalAi = chartData.reduce((acc, curr) => acc + curr.ai, 0);
  const totalHuman = chartData.reduce((acc, curr) => acc + curr.human, 0);
  const maxVal = Math.max(...chartData.map((d) => d.ai + d.human), 20);

  // Generate smooth cubic bezier SVG path
  const width = 500;
  const height = 140;

  const points = chartData.map((point, index) => {
    const x = (index / (chartData.length - 1)) * width;
    const y = height - (point.ai / maxVal) * (height - 20) - 10;
    return { x, y };
  });

  const getCurvedPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const linePath = getCurvedPath(points);
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="clean-card rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm relative overflow-hidden font-bengali">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              ২৪ ঘণ্টার লাইভ মেসেজ অ্যাক্টিভিটি
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
              রিয়েল-টাইম
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            এআই দ্বারা স্বয়ংক্রিয় রিপ্লাই বনাম ম্যানুয়াল রিপ্লাই অনুপাত
          </p>
        </div>

        {/* Legend Badges */}
        <div className="flex items-center gap-3 text-xs font-bold">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Bot className="h-3.5 w-3.5 text-indigo-600" />
            <span>AI Replied ({totalAi})</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
            <User className="h-3.5 w-3.5" />
            <span>Human ({totalHuman})</span>
          </div>
        </div>
      </div>

      {/* SVG Smooth Curved Area Chart */}
      <div className="relative h-52 w-full pt-6">
        <svg className="h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="aiCurveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="0" x2={width} y2="0" stroke="#f1f5f9" strokeDasharray="4 4" />
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#f1f5f9" strokeDasharray="4 4" />
          <line x1="0" y1={height} x2={width} y2={height} stroke="#e2e8f0" />

          {/* Smooth Curved Area Fill */}
          <path d={areaPath} fill="url(#aiCurveGradient)" />

          {/* Smooth Curved Line Stroke */}
          <path d={linePath} fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" />

          {/* Data Points with Hover Detection */}
          {points.map((p, idx) => (
            <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoverIndex(idx)} onMouseLeave={() => setHoverIndex(null)}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoverIndex === idx ? "5" : "3.5"}
                fill="#ffffff"
                stroke="#4F46E5"
                strokeWidth={hoverIndex === idx ? "2.5" : "2"}
                className="transition-all"
              />
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverIndex !== null && (
          <div
            className="absolute -top-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold shadow-lg pointer-events-none transform -translate-x-1/2 z-20"
            style={{ left: `${(hoverIndex / (chartData.length - 1)) * 100}%` }}
          >
            <div className="text-[10px] text-slate-400 font-mono">{chartData[hoverIndex].time}</div>
            <div className="text-emerald-400 font-mono">AI: {chartData[hoverIndex].ai} msgs</div>
            <div className="text-slate-300 font-mono">Human: {chartData[hoverIndex].human} msgs</div>
          </div>
        )}

        {/* X-Axis labels */}
        <div className="flex justify-between pt-3 text-[10px] font-bold text-slate-400 font-mono">
          {chartData.map((d, i) => (
            <span key={i}>{d.time}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

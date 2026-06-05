"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

const API = "http://localhost:8000";

type KW = { keyword: string; score: number };
type Keywords = { positive: KW[]; negative: KW[] };

export default function KeywordsView({
  name,
  onBack,
}: {
  name: string;
  onBack: () => void;
}) {
  const [kw, setKw] = useState<Keywords | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/operators/${encodeURIComponent(name)}/keywords`)
      .then((r) => r.json())
      .then((d) => { setKw(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [name]);

  return (
    <div style={{ minHeight: "100vh", padding: "40px 24px", maxWidth: 900, margin: "0 auto" }}>
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: "#8892a4",
          cursor: "pointer",
          fontSize: 14,
          padding: "4px 0",
          marginBottom: 24,
        }}
      >
        ← Back to operators
      </button>

      <header style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.01em" }}>
          {name}
        </h2>
        <p style={{ color: "#8892a4", fontSize: 13, marginTop: 4 }}>Top keywords by sentiment</p>
      </header>

      {loading && <div style={{ color: "#8892a4" }}>Loading…</div>}

      {kw && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <KWCard title="Positive themes" items={kw.positive} color="#22c55e" />
          <KWCard title="Negative themes" items={kw.negative} color="#ef4444" />
        </div>
      )}
    </div>
  );
}

function KWCard({ title, items, color }: { title: string; items: KW[]; color: string }) {
  if (!items || items.length === 0) {
    return (
      <div
        style={{
          background: "#1a1d27",
          border: "1px solid #2a2d3a",
          borderRadius: 10,
          padding: 24,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, color, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {title}
        </h3>
        <div style={{ color: "#8892a4", fontSize: 13 }}>No data</div>
      </div>
    );
  }

  const data = [...items].sort((a, b) => a.score - b.score);

  return (
    <div
      style={{
        background: "#1a1d27",
        border: "1px solid #2a2d3a",
        borderRadius: 10,
        padding: 24,
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          color,
          marginBottom: 20,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={items.length * 40 + 16}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
          <XAxis type="number" domain={[0, 0.6]} hide />
          <YAxis
            type="category"
            dataKey="keyword"
            width={150}
            tick={{ fill: "#e2e8f0", fontSize: 13 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "#0f1117",
              border: "1px solid #2a2d3a",
              borderRadius: 6,
              color: "#e2e8f0",
              fontSize: 13,
            }}
            formatter={(v) => [typeof v === "number" ? v.toFixed(3) : v, "score"]}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={color} fillOpacity={0.5 + (i / data.length) * 0.5} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

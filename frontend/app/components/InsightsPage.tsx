"use client";

import { useEffect, useState } from "react";
import { API_URL } from "../lib/config";

type TrustFlag   = { operator: string; keyword_matched: string };
type ComplaintTheme = { keyword: string; count: number };
type InsightsData = {
  worst_operator:        { name: string; neg_pct: number; top_negative_keyword: string | null } | null;
  best_operator:         { name: string; pos_pct: number; top_positive_keyword: string | null } | null;
  trust_flag:            TrustFlag | null;
  small_group_advantage: { small_group_avg: number; others_avg: number; delta: number } | null;
  top_complaint_theme:   ComplaintTheme | null;
};

type Card = {
  border: string;
  icon: "alert" | "search" | "trend";
  title: string;
  desc: string;
};

function buildCards(d: InsightsData): Card[] {
  const cards: Card[] = [];
  const shortName = (n: string) => n.split(",")[0].split(" from ")[0];

  if (d.worst_operator) {
    cards.push({
      border: "#DC2626",
      icon: "alert",
      title: `${shortName(d.worst_operator.name)} has ${d.worst_operator.neg_pct}% negative reviews`,
      desc: d.worst_operator.top_negative_keyword
        ? `"${d.worst_operator.top_negative_keyword}" is the top flagged keyword. Highest complaint rate among all operators.`
        : "Highest complaint rate among all operators.",
    });
  }

  if (d.trust_flag) {
    const sameAsWorst = d.worst_operator && d.trust_flag.operator === d.worst_operator.name;
    const sameKw = d.worst_operator && d.trust_flag.keyword_matched === d.worst_operator.top_negative_keyword;
    if (!sameAsWorst) {
      cards.push({
        border: "#DC2626",
        icon: "search",
        title: `"${d.trust_flag.keyword_matched}" detected at ${shortName(d.trust_flag.operator)}`,
        desc: "This keyword signals a trust or reliability issue. Guests are reporting problems that damage repeat bookings.",
      });
    } else if (!sameKw) {
      cards.push({
        border: "#DC2626",
        icon: "search",
        title: `"${d.trust_flag.keyword_matched}" flagged — trust gap at ${shortName(d.trust_flag.operator)}`,
        desc: "Guests are using language associated with deception or unreliability. A transparent booking process is the clearest counter.",
      });
    }
  }

  if (
    d.top_complaint_theme &&
    d.top_complaint_theme.keyword !== d.worst_operator?.top_negative_keyword &&
    d.top_complaint_theme.keyword !== d.trust_flag?.keyword_matched
  ) {
    cards.push({
      border: "#D97706",
      icon: "search",
      title: `"${d.top_complaint_theme.keyword}" is the top complaint theme`,
      desc: `Appears as the highest-scoring negative keyword across ${d.top_complaint_theme.count} operator${d.top_complaint_theme.count > 1 ? "s" : ""}. A recurring pain point in this market.`,
    });
  }

  if (d.small_group_advantage) {
    const sgLabel = d.small_group_advantage.delta > 0 ? "outperform" : "underperform";
    cards.push({
      border: "#16A34A",
      icon: "trend",
      title: `Small group operators ${sgLabel} by ${Math.abs(d.small_group_advantage.delta).toFixed(3)} sentiment score`,
      desc: `Small group avg: ${d.small_group_advantage.small_group_avg} vs ${d.small_group_advantage.others_avg} for standard formats. Format signals quality to guests before they even book.`,
    });
  }

  if (d.best_operator) {
    cards.push({
      border: "#16A34A",
      icon: "trend",
      title: `${shortName(d.best_operator.name)} leads with ${d.best_operator.pos_pct}% positive reviews`,
      desc: d.best_operator.top_positive_keyword
        ? `Top positive theme: "${d.best_operator.top_positive_keyword}". Benchmark for the market.`
        : "Top performer with the highest positive sentiment in the dataset.",
    });
  }

  return cards;
}

// ── SVG icons ──────────────────────────────────────────────────────────────

function AlertIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
      <path d="M12 15.75h.007v.008H12v-.008Z" strokeWidth="2.5" />
    </svg>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function TrendIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.281-2.281 5.941" />
    </svg>
  );
}

function InsightCard({ card }: { card: Card }) {
  const Icon = card.icon === "alert" ? AlertIcon
    : card.icon === "search" ? SearchIcon
    : TrendIcon;
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E5E7EB",
      borderLeft: `3px solid ${card.border}`,
      borderRadius: 8,
      padding: "20px 24px",
      display: "flex",
      gap: 16,
      alignItems: "flex-start",
    }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <Icon color={card.border} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 6, lineHeight: 1.45 }}>
          {card.title}
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
          {card.desc}
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/insights`)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setErr(true); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 13, color: "#9CA3AF" }}>Loading…</span>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div style={{
        background: "#FEF2F2", border: "1px solid #FECACA",
        borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#DC2626",
      }}>
        Could not load insights — is the API running?
      </div>
    );
  }

  const cards = buildCards(data);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", marginBottom: 4 }}>
          Key Findings
        </h2>
        <p style={{ fontSize: 13, color: "#9CA3AF" }}>
          Computed from {/* count derived from cards */ cards.length > 0 ? "live data" : "—"} · Nice–Monaco–Cannes corridor
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {cards.map((card, i) => (
          <InsightCard key={i} card={card} />
        ))}
      </div>
    </div>
  );
}

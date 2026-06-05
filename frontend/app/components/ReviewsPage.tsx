"use client";

import { useEffect, useState } from "react";

import { API_URL as API } from "../lib/config";

type Review = {
  operator: string;
  rating: number;
  date: string;
  review_text: string;
  language: string;
  sentiment_label: string;
  sentiment_score: number;
};

const PILL: Record<string, { bg: string; color: string }> = {
  positive: { bg: "#DCFCE7", color: "#16A34A" },
  negative: { bg: "#FEE2E2", color: "#DC2626" },
  neutral:  { bg: "#F3F4F6", color: "#6B7280" },
};

function scoreColor(s: number) {
  if (s > 0.85) return "#16A34A";
  if (s > 0.75) return "#D97706";
  return "#DC2626";
}

function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

const SELECT: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: 6,
  padding: "7px 12px",
  fontSize: 13,
  color: "#374151",
  background: "#fff",
  cursor: "pointer",
  outline: "none",
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOp, setFilterOp] = useState("all");
  const [filterSentiment, setFilterSentiment] = useState("all");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/reviews`)
      .then((r) => r.json())
      .then((d) => { setReviews(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const operators = Array.from(new Set(reviews.map((r) => r.operator))).sort();

  const filtered = reviews.filter((r) => {
    if (filterOp !== "all" && r.operator !== filterOp) return false;
    if (filterSentiment !== "all" && r.sentiment_label !== filterSentiment) return false;
    return true;
  });

  if (loading) {
    return (
      <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 13, color: "#9CA3AF" }}>Loading…</span>
      </div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <select
          value={filterOp}
          onChange={(e) => { setFilterOp(e.target.value); setExpandedKey(null); }}
          style={SELECT}
        >
          <option value="all">All operators</option>
          {operators.map((op) => (
            <option key={op} value={op}>{trunc(op, 48)}</option>
          ))}
        </select>

        <select
          value={filterSentiment}
          onChange={(e) => { setFilterSentiment(e.target.value); setExpandedKey(null); }}
          style={SELECT}
        >
          <option value="all">All sentiment</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
        </select>

        <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: "auto" }}>
          {filtered.length} of {reviews.length} reviews
        </span>
      </div>

      {/* Table */}
      <div style={{
        background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
              {[
                { label: "Operator",  w: "17%" },
                { label: "Date",      w: "9%"  },
                { label: "Review",    w: undefined },
                { label: "Sentiment", w: "11%" },
                { label: "Score",     w: "7%"  },
              ].map(({ label, w }) => (
                <th key={label} style={{
                  padding: "10px 16px", textAlign: "left",
                  fontSize: 11, fontWeight: 600, color: "#6B7280",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  width: w,
                }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const key = r.review_text;
              const expanded = expandedKey === key;
              const sc = PILL[r.sentiment_label] ?? PILL.neutral;

              return (
                <tr
                  key={i}
                  onClick={() => setExpandedKey(expanded ? null : key)}
                  style={{
                    borderBottom: "1px solid #F3F4F6",
                    cursor: "pointer",
                    background: expanded ? "#F9FAFB" : "transparent",
                    verticalAlign: "top",
                  }}
                  onMouseEnter={(e) => {
                    if (!expanded) e.currentTarget.style.background = "#F9FAFB";
                  }}
                  onMouseLeave={(e) => {
                    if (!expanded) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Operator */}
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{
                      display: "block", fontSize: 12, fontWeight: 500, color: "#374151",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      maxWidth: 140,
                    }}>
                      {r.operator.split(",")[0]}
                    </span>
                  </td>

                  {/* Date */}
                  <td style={{
                    padding: "11px 16px", fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap",
                  }}>
                    {r.date}
                  </td>

                  {/* Review text */}
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{
                      fontSize: 13, color: "#374151", lineHeight: 1.55,
                      display: "block",
                      whiteSpace: expanded ? "normal" : "nowrap",
                      overflow: expanded ? "visible" : "hidden",
                      textOverflow: expanded ? "clip" : "ellipsis",
                      maxWidth: expanded ? undefined : 480,
                    }}>
                      {expanded ? r.review_text : trunc(r.review_text, 120)}
                    </span>
                  </td>

                  {/* Sentiment */}
                  <td style={{ padding: "11px 16px", whiteSpace: "nowrap" }}>
                    <span style={{
                      background: sc.bg, color: sc.color,
                      borderRadius: 99, padding: "2px 9px",
                      fontSize: 12, fontWeight: 600,
                    }}>
                      {r.sentiment_label}
                    </span>
                  </td>

                  {/* Score */}
                  <td style={{
                    padding: "11px 16px",
                    fontSize: 13, fontWeight: 700,
                    color: scoreColor(r.sentiment_score),
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {r.sentiment_score.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

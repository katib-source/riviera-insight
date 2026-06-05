"use client";

type Operator = {
  name: string;
  avg_score: number;
  pos_pct: number;
  neg_pct: number;
  review_count: number;
};

function scoreColor(s: number) {
  if (s > 0.85) return "#16A34A";
  if (s > 0.75) return "#D97706";
  return "#DC2626";
}

function SentimentPill({ value, type }: { value: number; type: "pos" | "neg" }) {
  if (type === "neg" && value === 0) {
    return <span style={{ color: "#D1D5DB", fontSize: 13 }}>—</span>;
  }
  const bg = type === "pos" ? "#DCFCE7" : "#FEE2E2";
  const color = type === "pos" ? "#16A34A" : "#DC2626";
  return (
    <span style={{
      background: bg, color,
      borderRadius: 99, padding: "2px 9px",
      fontSize: 12, fontWeight: 600,
      whiteSpace: "nowrap",
    }}>
      {value}%
    </span>
  );
}

const COLS = [
  { label: "Operator", align: "left" as const },
  { label: "Reviews", align: "right" as const },
  { label: "Score", align: "right" as const },
  { label: "Positive", align: "right" as const },
  { label: "Negative", align: "right" as const },
];

export default function OperatorsTable({
  ops,
  onSelect,
}: {
  ops: Operator[];
  onSelect: (name: string) => void;
}) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E5E7EB",
      borderRadius: 8,
      overflow: "hidden",
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
            {COLS.map(({ label, align }) => (
              <th
                key={label}
                style={{
                  padding: "10px 18px",
                  textAlign: align,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#6B7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ops.map((op, i) => (
            <tr
              key={op.name}
              onClick={() => onSelect(op.name)}
              style={{
                borderBottom: i < ops.length - 1 ? "1px solid #F3F4F6" : "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <td style={{ padding: "14px 18px", maxWidth: 360 }}>
                <span style={{
                  display: "block",
                  fontWeight: 500,
                  fontSize: 13,
                  color: "#111827",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 340,
                }}>
                  {op.name}
                </span>
              </td>
              <td style={{
                padding: "14px 18px",
                textAlign: "right",
                fontSize: 13,
                color: "#6B7280",
              }}>
                {op.review_count}
              </td>
              <td style={{ padding: "14px 18px", textAlign: "right" }}>
                <span style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: scoreColor(op.avg_score),
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {op.avg_score.toFixed(2)}
                </span>
              </td>
              <td style={{ padding: "14px 18px", textAlign: "right" }}>
                <SentimentPill value={op.pos_pct} type="pos" />
              </td>
              <td style={{ padding: "14px 18px", textAlign: "right" }}>
                <SentimentPill value={op.neg_pct} type="neg" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

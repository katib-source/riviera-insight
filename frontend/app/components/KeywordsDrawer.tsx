"use client";

import { useEffect, useState } from "react";

import { API_URL as API } from "../lib/config";

type KW = { keyword: string; score: number };
type Keywords = { positive: KW[]; negative: KW[] };

function KWPill({ kw, type }: { kw: KW; type: "pos" | "neg" }) {
  const prominent = /scam|fraud|fake|cheat/i.test(kw.keyword);
  const bg = type === "pos" ? "#F0FDF4" : "#FEF2F2";
  const color = type === "pos" ? "#16A34A" : "#DC2626";
  const border = type === "pos" ? "#BBF7D0" : "#FECACA";
  return (
    <span style={{
      display: "inline-block",
      background: bg,
      color,
      border: `1px solid ${border}`,
      borderRadius: 99,
      padding: prominent ? "5px 14px" : "4px 11px",
      fontSize: prominent ? 14 : 13,
      fontWeight: prominent ? 700 : 400,
      lineHeight: 1.4,
    }}>
      {kw.keyword}
    </span>
  );
}

function PillSection({
  title,
  items,
  type,
  empty,
}: {
  title: string;
  items: KW[];
  type: "pos" | "neg";
  empty: string | null;
}) {
  return (
    <section>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 12,
      }}>
        {title}
      </div>
      {items.length === 0 && empty ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6B7280", fontSize: 13 }}>
          <span style={{ color: "#16A34A", fontSize: 15, lineHeight: 1 }}>&#10003;</span>
          {empty}
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {items.map((kw) => (
            <KWPill key={kw.keyword} kw={kw} type={type} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function KeywordsDrawer({
  name,
  onClose,
}: {
  name: string | null;
  onClose: () => void;
}) {
  const [kw, setKw] = useState<Keywords | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!name) return;
    setKw(null);
    setLoading(true);
    fetch(`${API}/operators/${encodeURIComponent(name)}/keywords`)
      .then((r) => r.json())
      .then((d) => { setKw(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [name]);

  return (
    <aside className={`drawer${name ? " drawer-open" : ""}`}>
      {name && (
        <>
          {/* Header */}
          <div style={{
            position: "sticky",
            top: 0,
            background: "#fff",
            borderBottom: "1px solid #E5E7EB",
            padding: "18px 20px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            zIndex: 1,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: "#9CA3AF",
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5,
              }}>
                Operator
              </div>
              <div style={{
                fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.45,
              }}>
                {name}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#9CA3AF", fontSize: 20, lineHeight: 1,
                padding: "2px 4px", flexShrink: 0, borderRadius: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#6B7280")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
            >
              &#215;
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "20px" }}>
            {loading && (
              <span style={{ fontSize: 13, color: "#9CA3AF" }}>Loading…</span>
            )}

            {kw && (
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <PillSection
                  title="What guests love"
                  items={kw.positive}
                  type="pos"
                  empty={null}
                />
                <PillSection
                  title="Pain points"
                  items={kw.negative}
                  type="neg"
                  empty="No pain points detected"
                />
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}

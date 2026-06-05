"use client";

import { useEffect, useState } from "react";
import OperatorsTable from "./OperatorsTable";
import KeywordsDrawer from "./KeywordsDrawer";
import ReviewsPage from "./ReviewsPage";
import InsightsPage from "./InsightsPage";
import { API_URL as API } from "../lib/config";

type Operator = {
  name: string;
  avg_score: number;
  pos_pct: number;
  neg_pct: number;
  review_count: number;
};

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "operators", label: "Operators" },
  { id: "reviews", label: "Reviews" },
  { id: "insights", label: "Insights" },
] as const;
type NavId = (typeof NAV)[number]["id"];

export default function Dashboard() {
  const [ops, setOps] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [nav, setNav] = useState<NavId>("operators");
  const [drawerOp, setDrawerOp] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/operators`)
      .then((r) => r.json())
      .then((d) => { setOps(d); setLoading(false); })
      .catch(() => {
        setErr("API unreachable — is FastAPI running on port 8000?");
        setLoading(false);
      });
  }, []);

  const totalReviews = ops.reduce((s, o) => s + o.review_count, 0);

  function openDrawer(name: string) {
    setDrawerOp(name);
  }

  function closeDrawer() {
    setDrawerOp(null);
  }

  function switchNav(id: NavId) {
    setNav(id);
    setDrawerOp(null);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* ── Sidebar ────────────────────────────── */}
      <aside style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 240,
        background: "#fff", borderRight: "1px solid #E5E7EB",
        display: "flex", flexDirection: "column",
        zIndex: 30,
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 20px 18px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
            RivieraInsight
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3, letterSpacing: "0.01em" }}>
            Tourism Intelligence
          </div>
        </div>

        <div style={{ height: 1, background: "#F3F4F6", margin: "0 16px" }} />

        {/* Nav */}
        <nav style={{ padding: "10px 10px", flex: 1 }}>
          {NAV.map(({ id, label }) => {
            const active = nav === id;
            return (
              <button
                key={id}
                onClick={() => switchNav(id)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "8px 12px", marginBottom: 1,
                  borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#111827" : "#6B7280",
                  background: active ? "#F3F4F6" : "transparent",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.5,
                }}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #F3F4F6" }}>
          <div style={{ fontSize: 11, color: "#D1D5DB" }}>v1.0 · Nice, FR</div>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────── */}
      <div style={{ marginLeft: 240, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          position: "sticky", top: 0, zIndex: 20,
          background: "#fff", borderBottom: "1px solid #E5E7EB",
          padding: "0 28px", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
            {NAV.find((n) => n.id === nav)?.label}
          </span>
          {!loading && !err && (
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>
              {totalReviews} reviews &middot; {ops.length} operators &middot; Last updated today
            </span>
          )}
        </header>

        {/* Page content */}
        <main style={{ padding: "28px", flex: 1 }}>
          {loading && (
            <div style={{
              height: 200, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 13, color: "#9CA3AF" }}>Loading…</span>
            </div>
          )}

          {err && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: 8, padding: "12px 16px",
              fontSize: 13, color: "#DC2626",
            }}>
              {err}
            </div>
          )}

          {!loading && !err && nav === "overview" && (
            <OverviewPage ops={ops} onSelect={(name) => { setNav("operators"); openDrawer(name); }} />
          )}

          {!loading && !err && nav === "operators" && (
            <OperatorsTable ops={ops} onSelect={openDrawer} />
          )}

          {!loading && !err && nav === "reviews" && <ReviewsPage />}

          {!loading && !err && nav === "insights" && <InsightsPage />}
        </main>
      </div>

      {/* ── Drawer overlay ─────────────────────── */}
      {drawerOp && <div className="overlay" onClick={closeDrawer} />}

      {/* ── Keywords drawer ────────────────────── */}
      <KeywordsDrawer name={drawerOp} onClose={closeDrawer} />
    </div>
  );
}

/* ── Overview page ───────────────────────────────── */

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "18px 20px",
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: "#9CA3AF",
        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
        {value}
      </div>
    </div>
  );
}

function OverviewPage({
  ops,
  onSelect,
}: {
  ops: Operator[];
  onSelect: (name: string) => void;
}) {
  const total = ops.reduce((s, o) => s + o.review_count, 0);
  const avg = ops.length
    ? (ops.reduce((s, o) => s + o.avg_score, 0) / ops.length).toFixed(2)
    : "—";
  const worst = [...ops].sort((a, b) => a.neg_pct - b.neg_pct).at(-1);

  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16,
      }}>
        <StatCard label="Total Reviews" value={total} />
        <StatCard label="Operators" value={ops.length} />
        <StatCard label="Avg Sentiment" value={avg} />
        <StatCard
          label="Most Complaints"
          value={worst ? worst.name.split(",")[0] : "—"}
        />
      </div>
      <OperatorsTable ops={ops} onSelect={onSelect} />
    </div>
  );
}


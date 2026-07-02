import { useState, useEffect } from "react";

function InsightCard({ title, children }) {
  return (
    <div className="insight-card">
      <div className="insight-header">{title}</div>
      <div className="insight-body">{children}</div>
    </div>
  );
}

function Insights({ week }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/insights?week=${week}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Could not load insights."); setLoading(false); });
  }, [week]);

  if (loading) return <p className="loading-msg">Generating insights for week {week}… (this may take a moment)</p>;
  if (error)   return <p className="error-msg">{error}</p>;

  const { dynamic_pricing, wholesale_suggestion, seasonal_suggestions } = data;

  return (
    <div className="insights-grid">
      {/* ── Dynamic Pricing ── */}
      <InsightCard title="💰 Suggested Pricing">
        {dynamic_pricing.map((item, i) => (
          <div key={i} className="insight-row">
            <div className="item-name">{item.item}</div>
            <div className="item-detail">
              ${item.current_price.toFixed(2)} → ${item.proposed_price.toFixed(2)}
            </div>
            <div className="item-reasoning">{item.reasoning}</div>
          </div>
        ))}
      </InsightCard>

      {/* ── Wholesale ── */}
      <InsightCard title="📦 Restock Orders">
        {wholesale_suggestion.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>No restocking needed this week.</p>
        ) : (
          wholesale_suggestion.map((item, i) => (
            <div key={i} className="insight-row">
              <div className="item-name">{item.item}</div>
              <div className="item-detail">Order {item.order_qty} units</div>
              <div className="item-reasoning">{item.reasoning}</div>
            </div>
          ))
        )}
      </InsightCard>

      {/* ── Seasonal ── */}
      <InsightCard title="🌿 Seasonal Ideas">
        {seasonal_suggestions.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>No seasonal suggestions this week.</p>
        ) : (
          seasonal_suggestions.map((item, i) => (
            <div key={i} className="insight-row">
              <div className="item-name">{item.item}</div>
              <div className="item-reasoning">{item.reasoning}</div>
            </div>
          ))
        )}
      </InsightCard>
    </div>
  );
}

export default Insights;

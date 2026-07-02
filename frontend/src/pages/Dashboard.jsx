import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
} from "recharts";

const PIE_COLORS = ["#0e2e85", "#3b5fc0", "#6b8cda", "#a0b4ef", "#c8d4f7"];

function Dashboard({ week }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/data?week=${week}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Could not load data."); setLoading(false); });
  }, [week]);

  if (loading) return <p className="loading-msg">Loading week {week} data…</p>;
  if (error)   return <p className="error-msg">{error}</p>;

  const { inventory, budget, sales } = data;

  const totalRevenue = sales.reduce(
    (sum, s) => sum + (s.current_price ?? 0) * (s.units_sold ?? 0), 0
  );
  const totalSales    = sales.reduce((sum, s) => sum + (s.units_sold ?? 0), 0);
  const totalInventory = inventory.reduce((sum, i) => sum + (i.count ?? 0), 0);
  const totalBudget   = budget.total_weekly_budget;
  const profit        = totalRevenue - totalBudget;

  const salesChartData = sales.map((s) => ({
    name: s.item_name ?? s.iten_name,
    units: s.units_sold,
    revenue: +(s.current_price * s.units_sold).toFixed(2),
  }));

  const budgetData = Object.entries(budget.allocated).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
  }));

  return (
    <>
      {/* ── KPI row ── */}
      <div className="dashboard-grid">
        <div className="metric-card">
          <span className="card-label">Revenue</span>
          <span className="card-value">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="card-sub">Week {week}</span>
        </div>
        <div className="metric-card">
          <span className="card-label">Profit</span>
          <span className="card-value" style={{ color: profit >= 0 ? "#1a7a3c" : "#c0392b" }}>
            ${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="card-sub">After ${totalBudget.toLocaleString()} in costs</span>
        </div>
        <div className="metric-card">
          <span className="card-label">Units Sold</span>
          <span className="card-value">{totalSales.toLocaleString()}</span>
          <span className="card-sub">Across {sales.length} products</span>
        </div>
        <div className="metric-card">
          <span className="card-label">Inventory</span>
          <span className="card-value">{totalInventory.toLocaleString()}</span>
          <span className="card-sub">Items in stock</span>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="chart-row">
        <div className="chart-card">
          <h3>Units Sold by Product</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={salesChartData} margin={{ top: 30, right: 8, left: -10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf5" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="units" fill="#0e2e85" radius={[4, 4, 0, 0]} name="Units sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Budget Allocation</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={budgetData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85} label={false} labelLine={false}>
                {budgetData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend
                layout = "horizontal"
                verticalAlign = "bottom"
                align = "center"
                iconType = "circle"
                iconSize = {8}
                formatter = {(value) => <span style ={{fontSize: "0.95rem"}}>{value}</span>}
              />
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Revenue by Product</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={salesChartData} margin={{ top: 30, right: 8, left: -10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf5" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `$${v}`} />
              <Bar dataKey="revenue" fill="#3b5fc0" radius={[4, 4, 0, 0]} name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

export default Dashboard;

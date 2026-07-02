import { useState, useEffect } from "react";

function Account() {
  //sets up default states
  const [profile, setProfile] = useState({
    business_name: "",
    owner_name: "",
    business_type: "",
    email: "",
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [weeks, setWeeks] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  //fetch profile from database + summary of each weeks data 
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d));

    fetch("/api/weeks")
      .then((r) => r.json())
      .then(async (d) => {
        const weekSummaries = [];
        for (let i = 1; i <= d.total_weeks; i++) {
          const res = await fetch(`/api/data?week=${i}`);
          const data = await res.json();
          const revenue = data.sales.reduce(
            (sum, s) => sum + (s.current_price ?? 0) * (s.units_sold ?? 0), 0
          );
          const units = data.sales.reduce(
            (sum, s) => sum + (s.units_sold ?? 0), 0
          );
          const profit = revenue - data.budget.total_weekly_budget;
          weekSummaries.push({ week: i, revenue, units, profit });
        }
        setWeeks(weekSummaries);
      });
  }, []);

  // copies curr profile into draft and switches to edit mode
  const startEditing = () => {
    setDraft({ ...profile });
    setEditing(true);
  };
  //throws away draft and goes to view mode
  const cancelEditing = () => {
    setEditing(false);
    setDraft({});
  };
  //sends draft to backend, updates displayed profile, exits edit mode
  const saveProfile = async () => {
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setProfile(draft);
    setEditing(false);
  };

  //processes new file upload
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg("");

    //FormData sends files over HTTP
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload-week", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        //after successful upload, immediately fetch that weeks summary + adds to table
        setUploadMsg(`✅ Successfully uploaded as Week ${data.week}!`);
        const weekRes = await fetch(`/api/data?week=${data.week}`);
        const weekData = await weekRes.json();
        const revenue = weekData.sales.reduce(
          (sum, s) => sum + (s.current_price ?? 0) * (s.units_sold ?? 0), 0
        );
        const units = weekData.sales.reduce(
          (sum, s) => sum + (s.units_sold ?? 0), 0
        );
        const profit = revenue - weekData.budget.total_weekly_budget;
        setWeeks((prev) => [...prev, { week: data.week, revenue, units, profit }]);
      } else {
        setUploadMsg(`❌ Error: ${data.error}`);
      }
    } catch {
      setUploadMsg("❌ Could not connect to the backend.");
    }
    setUploading(false);
  };

  //generates initials for the owner's avatar
  const initials = profile.owner_name
    ? profile.owner_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "?";


  return (
    <div className="account-page">

        {/* Profile Card */}
        <div className="account-card">
        <div className="account-card-header">
            <h2>Profile</h2>
            {!editing && (
            <button className="edit-btn" onClick={startEditing}>Edit</button>
            )}
        </div>

        <div className="account-body">
            <div className="avatar">{initials}</div>

            {editing ? (
            <div className="profile-fields">
                <label>Business Name
                <input
                    value={draft.business_name}
                    onChange={(e) => setDraft({ ...draft, business_name: e.target.value })}
                />
                </label>
                <label>Owner Name
                <input
                    value={draft.owner_name}
                    onChange={(e) => setDraft({ ...draft, owner_name: e.target.value })}
                />
                </label>
                <label>Business Type
                <input
                    value={draft.business_type}
                    onChange={(e) => setDraft({ ...draft, business_type: e.target.value })}
                />
                </label>
                <label>Email
                <input
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
                </label>
                <div className="edit-actions">
                <button className="save-btn" onClick={saveProfile}>Save</button>
                <button className="cancel-btn" onClick={cancelEditing}>Cancel</button>
                </div>
            </div>
            ) : (
            <div className="profile-fields">
                <div className="profile-row">
                <span className="profile-label">Business Name</span>
                <span className="profile-value">{profile.business_name || "—"}</span>
                </div>
                <div className="profile-row">
                <span className="profile-label">Owner Name</span>
                <span className="profile-value">{profile.owner_name || "—"}</span>
                </div>
                <div className="profile-row">
                <span className="profile-label">Business Type</span>
                <span className="profile-value">{profile.business_type || "—"}</span>
                </div>
                <div className="profile-row">
                <span className="profile-label">Email</span>
                <span className="profile-value">{profile.email || "—"}</span>
                </div>
            </div>
            )}
        </div>
        </div>

        {/* Data Management Card*/}
        <div className="account-card">
        <div className="account-card-header">
            <h2>Data Management</h2>
        </div>

        <div className="account-body">
            <table className="weeks-table">
            <thead>
                <tr>
                <th>Week</th>
                <th>Revenue</th>
                <th>Units Sold</th>
                <th>Profit</th>
                </tr>
            </thead>
            <tbody>
                {weeks.map((w) => (
                <tr key={w.week}>
                    <td>Week {w.week}</td>
                    <td>${w.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>{w.units.toLocaleString()}</td>
                    <td style={{ color: w.profit >= 0 ? "#1a7a3c" : "#c0392b" }}>
                    ${w.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>

            <div className="upload-section">
            <p className="upload-label">Upload a new week's data as a JSON file:</p>
            <label className="upload-btn">
                {uploading ? "Uploading…" : "Choose File"}
                <input
                type="file"
                accept=".json"
                onChange={handleUpload}
                style={{ display: "none" }}
                />
            </label>
            {uploadMsg && <p className="upload-msg">{uploadMsg}</p>}
            </div>
        </div>
        </div>

    </div>
  );
}

export default Account;



import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModuleCard from "./components/ModuleCard";

function Dashboard() {
  const [modules, setModules] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/_data/moduleCard.json")
      .then((res) => res.json())
      .then((data) => setModules(data))
      .catch((err) => console.error("Failed to load modules", err));
  }, []);

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ marginBottom: "20px" }}>Modules</h1>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        {modules.map((module) => (
          <div
            key={module.code}
            onClick={() => navigate(`/module/${module.code}`)}
          >
            <ModuleCard
              code={module.code}
              title={module.title}
              color={module.color}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;

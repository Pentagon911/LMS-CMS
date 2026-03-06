import React, { useRef } from "react";

const ModuleCard = ({ code, title, color }) => {
  const tabRef = useRef(null);

  const cardStyle = {
    background: `linear-gradient(145deg, rgba(0,0,0,0.8) 0%, ${
      color || "#6c5ce7"
    } 50%, rgba(255,255,255,0.8) 100%)`,
    borderRadius: "14px",
    padding: "20px 16px 16px 16px",
    width: "200px",
    height: "120px",
    boxShadow: "8px 8px 15px rgba(0,0,0,0.3)",
    position: "relative",
    overflow: "visible",
    fontFamily: "Arial, sans-serif",
    cursor: "pointer",
    transition: "all 0.25s ease",
    color: "#fff",
    transform: "scale(1)",
  };

  const tabStyle = {
    position: "absolute",
    top: "10px",
    left: "5px",
    width: "190px",
    height: "5px",
    background: color || "#6c5ce7",
    borderTopLeftRadius: "15px",
    borderTopRightRadius: "15px",
    boxShadow: "4px -4px 8px rgba(0,0,0,0.3)",
    transition: "all 0.25s ease",
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform =
          "translateY(-6px) scale(1.05)";
        e.currentTarget.style.boxShadow =
          "15px 15px 25px rgba(0,0,0,0.5)";
        tabRef.current.style.height = "10px";
        tabRef.current.style.top = "5px";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow =
          "8px 8px 15px rgba(0,0,0,0.3)";
        tabRef.current.style.height = "5px";
        tabRef.current.style.top = "10px";
      }}
    >
      <div ref={tabRef} style={tabStyle}></div>

      <div style={{ position: "relative", zIndex: 2 }}>
        <div
  style={{
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "50px",
    fontWeight: "700",
    fontSize: "16px",
    marginBottom: "8px",
    boxShadow: "0px 0px 5px black",
    textShadow: "2px 2px 6px rgba(0,0,0,0.8)",
  }}
>
  {code}
</div>
        <div style={{ fontSize: "14px", fontWeight: "700", textShadow: "0px 0px 6px black" }}>
          {title}
        </div>
      </div>
    </div>
  );
};

export default ModuleCard;

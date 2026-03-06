import React from "react";
import WeekCard from "./components/WeekCard.jsx"
import QuizEditor from "./components/QuizEditor.jsx"

// import JSON data
import weekData from "./mockdata/weekcard.json";

function App() {

  // If you want, you can set this true/false depending on the user role
  const isLecturer = true;

  return (
     <div style={{ padding: "10px", maxWidth: "100%", margin: "auto" }}>
       <h1>Course Weeks</h1>

       <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
         {weekData.map((week, index) => (
           <WeekCard
             key={index}
             data={week}
             isLecturer={isLecturer}
           />
         ))}
       </div>
     </div>
  );
}

export default App;

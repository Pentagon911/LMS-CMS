import weeks from "./mockdata/weekcard.json";
import WeekCard from "./components/WeekCard";

function App() {

  const isLecturer = true; // change to false for students

  return (
    <div>
      {weeks.map((week, index) => (
        <WeekCard key={index} data={week} isLecturer={isLecturer} />
      ))}
    </div>
  );
}

export default App;

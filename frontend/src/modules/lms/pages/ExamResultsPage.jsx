import React, { useState, useEffect } from 'react';
import request from '../../../utils/requestMethods.jsx';
import './ExamResultsPage.css';

const ExamResultsPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ semester: '' });

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await request.GET('/api/exam-results/');
        setResults(data.results || []);
      } catch (err) {
        setResults([
          { id: 1, courseCode: 'CS1012', courseTitle: 'Programming Fundamentals', semester: 'Semester 1', year: 2026, grade: 'A', credits: 3, gpa: 4.0 },
          { id: 2, courseCode: 'CS1040', courseTitle: 'Program Construction', semester: 'Semester 1', year: 2026, grade: 'B+', credits: 3, gpa: 3.3 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const filteredResults = results.filter(r => filter.semester ? r.semester === filter.semester : true);

  const calculateGPA = () => {
    if (filteredResults.length === 0) return 'N/A';
    const totalPoints = filteredResults.reduce((sum, r) => sum + (r.gpa * r.credits), 0);
    const totalCredits = filteredResults.reduce((sum, r) => sum + r.credits, 0);
    return (totalPoints / totalCredits).toFixed(2);
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div><p>Loading results...</p></div>;

  return (
    <div className="exam-results-container">
      <div className="exam-results-header">
        <h1>Exam Results</h1>
        <p>View your academic performance</p>
      </div>
      <div className="filters">
        <select onChange={(e) => setFilter({ ...filter, semester: e.target.value })} value={filter.semester}>
          <option value="">All Semesters</option>
          <option value="Semester 1">Semester 1</option>
          <option value="Semester 2">Semester 2</option>
        </select>
      </div>
      <div className="gpa-card">
        <h3>Semester GPA</h3>
        <div className="gpa-value">{calculateGPA()}</div>
      </div>
      <div className="results-table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Title</th>
              <th>Semester</th>
              <th>Year</th>
              <th>Grade</th>
              <th>Credits</th>
              <th>Grade Points</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map(result => (
              <tr key={result.id}>
                <td>{result.courseCode}</td>
                <td>{result.courseTitle}</td>
                <td>{result.semester}</td>
                <td>{result.year}</td>
                <td className={`grade-${result.grade.charAt(0)}`}>{result.grade}</td>
                <td>{result.credits}</td>
                <td>{result.gpa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExamResultsPage;
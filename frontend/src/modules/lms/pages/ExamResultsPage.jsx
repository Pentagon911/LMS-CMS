import React, { useState, useEffect } from 'react';
import request from '../../../utils/requestMethods.jsx';
import './ExamResultsPage.css';

const ExamResultsPage = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('all');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        // Call the my_results endpoint from your backend
        const data = await request.GET('/lms/exam_results/my_results/');
        setResults(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Failed to load exam results. Please try again later.');
        // Fallback data for testing (remove in production)
        setResults({
          student: {
            name: 'John Doe',
            index_number: '2220',
            intake_batch: 'Batch 2024',
            program: 'BSc in Computer Science'
          },
          semester_results: [
            {
              semester: 1,
              results: [
                {
                  id: 1,
                  course_code: 'CS101',
                  course_name: 'Programming Fundamentals',
                  exam_title: 'Final Exam - CS101',
                  score: 85,
                  grade: 'A',
                  credits: 3
                },
                {
                  id: 2,
                  course_code: 'CS102',
                  course_name: 'Data Structures',
                  exam_title: 'Final Exam - CS102',
                  score: 78,
                  grade: 'B+',
                  credits: 3
                }
              ],
              sgpa: 3.75,
              cgpa: 3.75
            },
            {
              semester: 2,
              results: [
                {
                  id: 3,
                  course_code: 'CS201',
                  course_name: 'Database Systems',
                  exam_title: 'Final Exam - CS201',
                  score: 82,
                  grade: 'A-',
                  credits: 3
                }
              ],
              sgpa: 3.50,
              cgpa: 3.62
            }
          ],
          final_cgpa: 3.62
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  // Helper function to get grade class for styling
  const getGradeClass = (grade) => {
    if (!grade) return 'grade-default';
    const firstChar = grade.charAt(0);
    if (firstChar === 'A') return 'grade-a';
    if (firstChar === 'B') return 'grade-b';
    if (firstChar === 'C') return 'grade-c';
    if (firstChar === 'D') return 'grade-d';
    return 'grade-f';
  };

  // Helper to get numeric grade point
  const getGradePoint = (grade) => {
    const gradeMap = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'F': 0.0
    };
    return gradeMap[grade] || 0;
  };

  if (loading) {
    return (
      <div className="exam-results-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your exam results...</p>
        </div>
      </div>
    );
  }

  if (error && !results) {
    return (
      <div className="exam-results-container">
        <div className="error-state">
          <p>⚠️ {error}</p>
        </div>
      </div>
    );
  }

  // Get all unique semesters for filter dropdown
  const semesters = results?.semester_results?.map(sr => sr.semester) || [];

  // Filter semester results based on selection
  const filteredSemesterResults = selectedSemester === 'all'
    ? results?.semester_results
    : results?.semester_results?.filter(sr => sr.semester === parseInt(selectedSemester));

  // Get current CGPA for selected semester
  const currentCGPA = selectedSemester === 'all'
    ? results?.final_cgpa
    : filteredSemesterResults?.[0]?.cgpa || 0;

  return (
    <div className="exam-results-container">
      {/* Header Section */}
      <div className="exam-results-header">
        <h1>Exam Results</h1>
        <p className="exam-results-desc">View your academic performance and grades</p>
      </div>

      {/* Student Info Card */}
      {results?.student && (
        <div className="student-info-card">
          <div className="student-info">
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{results.student.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">User Name:</span>
              <span className="info-value">{results.student.index_number}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Program:</span>
              <span className="info-value">{results.student.program}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Intake Batch:</span>
              <span className="info-value">{results.student.intake_batch || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Semester Filter */}
      {semesters.length > 0 && (
        <div className="filters">
          <label htmlFor="semester-filter">Filter by Semester:</label>
          <select
            id="semester-filter"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="all">All Semesters</option>
            {semesters.map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>
      )}

      {/* CGPA Card */}
      {currentCGPA && (
        <div className="gpa-card">
          <h3>{selectedSemester === 'all' ? 'Cumulative GPA (CGPA)' : `Semester ${selectedSemester} GPA`}</h3>
          <div className="gpa-value">{currentCGPA.toFixed(2)}</div>
        </div>
      )}

      {/* Results by Semester */}
      {filteredSemesterResults?.map((semesterData) => (
        <div key={semesterData.semester} className="semester-section">
          <div className="semester-header">
            <h2>Semester {semesterData.semester}</h2>
            <div className="semester-stats">
              <span className="semester-sgpa">SGPA: {semesterData.sgpa.toFixed(2)}</span>
              <span className="semester-cgpa">CGPA: {semesterData.cgpa.toFixed(2)}</span>
            </div>
          </div>

          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Exam Title</th>
                  <th>Score</th>
                  <th>Grade</th>
                  <th>Grade Points</th>
                </tr>
              </thead>
              <tbody>
                {semesterData.results?.map((result) => (
                  <tr key={result.id}>
                    <td>{result.course_code}</td>
                    <td>{result.course_name}</td>
                    <td>{result.exam_title}</td>
                    <td>{result.score}%</td>
                    <td className={`grade-cell ${getGradeClass(result.grade)}`}>
                      {result.grade || 'N/A'}
                    </td>
                    <td>{getGradePoint(result.grade).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Empty State */}
      {(!filteredSemesterResults || filteredSemesterResults.length === 0) && (
        <div className="empty-state">
          <p>No exam results found for the selected semester.</p>
        </div>
      )}
    </div>
  );
};

export default ExamResultsPage;
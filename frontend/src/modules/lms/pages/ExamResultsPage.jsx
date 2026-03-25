import React, { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import request from '../../../utils/requestMethods.jsx';
import './ExamResultsPage.css';

const ExamResultsPage = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Get user role from token
  useEffect(() => {
    const getUserRole = () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          console.log('No token found');
          setUserRole('student');
          setRoleLoading(false);
          return;
        }

        const decoded = jwtDecode(token);
        console.log('Decoded token:', decoded);

        const role = decoded.role || decoded.user_role || 'student';
        setUserRole(role);

        setUserInfo({
          username: decoded.username || decoded.user_username,
          userId: decoded.user_id || decoded.id,
          email: decoded.email
        });

        console.log('User role detected:', role);
      } catch (err) {
        console.error('Error getting user role:', err);
        setUserRole('student');
      } finally {
        setRoleLoading(false);
      }
    };

    getUserRole();
  }, []);

  // Fetch courses for ALL users (students need course names too)
  useEffect(() => {
    if (userRole && !roleLoading) {
      fetchCourses();
    }
    if (userRole && userRole === 'admin') {
      fetchStudents();
    }
  }, [userRole, roleLoading]);

  // Fetch results when role is determined and filters change
  useEffect(() => {
    if (userRole && !roleLoading && courses.length > 0) {
      fetchResults();
    }
  }, [userRole, roleLoading, selectedCourse, selectedStudent, courses]);

  const fetchCourses = async () => {
    try {
      const data = await request.GET('/lms/courses/');
      setCourses(data);
      console.log('Courses fetched:', data.length);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await request.GET('/api/users/?role=student');
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchResults = async () => {
    try {
      setLoading(true);

      console.log('Fetching results for role:', userRole);
      console.log('Selected course:', selectedCourse);
      console.log('Selected student:', selectedStudent);

      let endpoint;
      let params = [];

      if (userRole === 'student') {
        endpoint = '/lms/exam_results/my_results/';
      } else if (userRole === 'instructor') {
        endpoint = '/lms/exam_results/instructor_results/';
        if (selectedCourse !== 'all') {
          params.push(`course=${selectedCourse}`);
        }
      } else if (userRole === 'admin') {
        endpoint = '/lms/exam_results/admin_results_grouped/';
        if (selectedCourse !== 'all') {
          params.push(`course=${selectedCourse}`);
        }
        if (selectedStudent !== 'all') {
          params.push(`student=${selectedStudent}`);
        }
      }

      if (params.length) {
        endpoint += `?${params.join('&')}`;
      }

      console.log('Calling endpoint:', endpoint);

      const data = await request.GET(endpoint);
      console.log('Received data:', data);

      if (userRole === 'student') {
        setResults(data);
      } else if (userRole === 'instructor') {
        // For instructor, data is a flat array of results
        // We need to group them by semester and filter by course
        const filteredData = selectedCourse !== 'all'
          ? data.filter(result => result.course_code === courses.find(c => c.id === parseInt(selectedCourse))?.code)
          : data;
        const groupedResults = groupResultsBySemester(filteredData);
        setResults(groupedResults);
      } else if (userRole === 'admin') {
        setResults(data);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to load exam results. Please try again later.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const groupResultsBySemester = (resultsList) => {
    if (!resultsList || resultsList.length === 0) return null;

    const grouped = {};
    resultsList.forEach(result => {
      const semester = result.exam?.course?.semester || 1;
      if (!grouped[semester]) {
        grouped[semester] = {
          semester: semester,
          results: [],
          total_credits: 0,
          total_grade_points: 0
        };
      }
      grouped[semester].results.push(result);
      const credits = result.exam?.course?.credits || 3;
      const gradePoint = getGradePoint(result.grade);
      grouped[semester].total_credits += credits;
      grouped[semester].total_grade_points += gradePoint * credits;
    });

    let cumulativeCredits = 0;
    let cumulativePoints = 0;
    const semesterResults = Object.keys(grouped).sort().map(sem => {
      const data = grouped[sem];
      const sgpa = data.total_credits ? data.total_grade_points / data.total_credits : 0;
      cumulativeCredits += data.total_credits;
      cumulativePoints += data.total_grade_points;
      const cgpa = cumulativeCredits ? cumulativePoints / cumulativeCredits : 0;

      return {
        semester: parseInt(sem),
        results: data.results,
        sgpa: sgpa,
        cgpa: cgpa
      };
    });

    const finalCgpa = cumulativeCredits ? cumulativePoints / cumulativeCredits : 0;

    return {
      semester_results: semesterResults,
      final_cgpa: finalCgpa
    };
  };

  const getGradePoint = (grade) => {
    const gradeMap = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'F': 0.0
    };
    return gradeMap[grade] || 0;
  };

  const getGradeClass = (grade) => {
    if (!grade) return 'grade-default';
    const firstChar = grade.charAt(0);
    if (firstChar === 'A') return 'grade-a';
    if (firstChar === 'B') return 'grade-b';
    if (firstChar === 'C') return 'grade-c';
    if (firstChar === 'D') return 'grade-d';
    return 'grade-f';
  };

  // Helper function to get course name from course code
  const getCourseName = (courseCode) => {
    const courseObj = courses.find(c => c.code === courseCode);
    return courseObj?.name || 'N/A';
  };

  if (roleLoading) {
    return (
      <div className="exam-results-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading user information...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="exam-results-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading exam results...</p>
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

  // Admin view - with proper student index (username)
  if (userRole === 'admin') {
    return (
      <div className="exam-results-container">
        <div className="exam-results-header">
          <h1>All Exam Results</h1>
          <p className="exam-results-desc">Manage and view all exam results</p>
        </div>

        <div className="filters-section">
          {courses.length > 0 && (
            <div className="filter-group">
              <label>Course:</label>
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setSelectedSemester('all');
                }}
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {students.length > 0 && (
            <div className="filter-group">
              <label>Student:</label>
              <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                <option value="all">All Students</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.username} - {student.first_name} {student.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {results && results.length > 0 ? (
          results.map((studentData) => (
            <div key={studentData.student.id} className="student-results-section">
              <div className="student-header">
                <div className="student-info-header">
                  <h3>{studentData.student.name}</h3>
                  <p className="student-index">Index: {studentData.student.username}</p>
                </div>
                <div className="student-cgpa">Overall CGPA: {studentData.final_cgpa}</div>
              </div>

              {studentData.semester_results.map((semesterData) => (
                <div key={semesterData.semester} className="semester-section">
                  <div className="semester-header">
                    <h4>Semester {semesterData.semester}</h4>
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
                        {semesterData.results?.map((result) => {
                          const courseCode = result.course_code || result.exam?.course?.code || 'N/A';
                          const courseName = getCourseName(courseCode);

                          return (
                            <tr key={result.id}>
                              <td>{courseCode}</td>
                              <td>{courseName}</td>
                              <td>{result.exam_title || result.exam?.title || 'N/A'}</td>
                              <td>{result.score}%</td>
                              <td className={`grade-cell ${getGradeClass(result.grade)}`}>
                                {result.grade || 'N/A'}
                              </td>
                              <td>{getGradePoint(result.grade).toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No exam results found for the selected criteria.</p>
          </div>
        )}
      </div>
    );
  }

  // Instructor view 
  if (userRole === 'instructor') {
    const semesterResults = results?.semester_results || [];
    const semesters = semesterResults.map(sr => sr.semester);
    const filteredSemesterResults = selectedSemester === 'all'
      ? semesterResults
      : semesterResults.filter(sr => sr.semester === parseInt(selectedSemester));

    return (
      <div className="exam-results-container">
        <div className="exam-results-header">
          <h1>Course Exam Results</h1>
          <p className="exam-results-desc">View results for your courses</p>
        </div>

        {courses.length > 0 && (
          <div className="filters-section">
            <div className="filter-group">
              <label>Course:</label>
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setSelectedSemester('all');
                }}
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {semesters.length > 0 && (
          <div className="filters">
            <label>Filter by Semester:</label>
            <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
              <option value="all">All Semesters</option>
              {semesters.map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
        )}

        {filteredSemesterResults.map((semesterData) => (
          <div key={semesterData.semester} className="semester-section">
            <div className="semester-header">
              <h2>Semester {semesterData.semester}</h2>
            </div>

            <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Student Index</th>
                    <th>Student Name</th>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Exam Title</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Grade Points</th>
                  </tr>
                </thead>
                <tbody>
                  {semesterData.results?.map((result) => {
                    const courseCode = result.course_code || result.exam?.course?.code || 'N/A';
                    const courseName = getCourseName(courseCode);

                    // Generate student index from student name
                    let studentIndex = result.student_username || result.student?.username || 'N/A';

                    if (studentIndex === 'N/A' && result.student_name) {
                      studentIndex = result.student_name
                        .toLowerCase()
                        .replace(/\s+/g, '_')
                        .replace(/[^a-z0-9_]/g, '');
                    }

                    return (
                      <tr key={result.id}>
                        <td><strong>{studentIndex}</strong></td>
                        <td>{result.student_name || 'N/A'}</td>
                        <td>{courseCode}</td>
                        <td>{courseName}</td>
                        <td>{result.exam_title || result.exam?.title || 'N/A'}</td>
                        <td>{result.score}%</td>
                        <td className={`grade-cell ${getGradeClass(result.grade)}`}>
                          {result.grade || 'N/A'}
                        </td>
                        <td>{getGradePoint(result.grade).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {filteredSemesterResults.length === 0 && (
          <div className="empty-state">
            <p>No exam results found for the selected criteria.</p>
          </div>
        )}
      </div>
    );
  }

  // Student view
  const semesterResults = results?.semester_results || [];
  const semesters = semesterResults.map(sr => sr.semester);
  const filteredSemesterResults = selectedSemester === 'all'
    ? semesterResults
    : semesterResults.filter(sr => sr.semester === parseInt(selectedSemester));

  return (
    <div className="exam-results-container">
      <div className="exam-results-header">
        <h1>My Exam Results</h1>
        <p className="exam-results-desc">View your academic performance and grades</p>
      </div>

      {results?.student && (
        <div className="student-info-card">
          <div className="student-info">
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{results.student.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Index Number:</span>
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

      {semesters.length > 0 && (
        <div className="filters">
          <label>Filter by Semester:</label>
          <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
            <option value="all">All Semesters</option>
            {semesters.map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>
      )}

      {results?.final_cgpa && (
        <div className="gpa-card">
          <h3>Overall Cumulative GPA (CGPA)</h3>
          <div className="gpa-value">{results.final_cgpa.toFixed(2)}</div>
        </div>
      )}

      {filteredSemesterResults.map((semesterData) => (
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
                {semesterData.results?.map((result) => {
                  const courseCode = result.course_code || result.exam?.course?.code || 'N/A';
                  const courseName = getCourseName(courseCode);

                  return (
                    <tr key={result.id}>
                      <td>{courseCode}</td>
                      <td>{courseName}</td>
                      <td>{result.exam_title || result.exam?.title || 'N/A'}</td>
                      <td>{result.score}%</td>
                      <td className={`grade-cell ${getGradeClass(result.grade)}`}>
                        {result.grade || 'N/A'}
                      </td>
                      <td>{getGradePoint(result.grade).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {filteredSemesterResults.length === 0 && (
        <div className="empty-state">
          <p>No exam results found for the selected semester.</p>
        </div>
      )}
    </div>
  );
};

export default ExamResultsPage;
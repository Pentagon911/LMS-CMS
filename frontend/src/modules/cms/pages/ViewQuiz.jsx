import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import request from '../../../utils/requestMethods.jsx';
import { getUserFromToken } from "../../../utils/auth";
import './ViewQuiz.css';
import { 
  MdArrowBack, MdQuiz, MdPeople, MdScore, MdCheckCircle, 
  MdCancel, MdVisibility, MdAccessTime, MdBarChart, 
  MdDownload, MdExpandMore, MdChevronRight, MdClose,
  MdTrendingUp, MdTrendingDown, MdStar, MdStarOutline
} from 'react-icons/md';

const QuizInstructorPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' or 'stats'

  useEffect(() => {
    const token = getUserFromToken();
    setUser(token);
  }, []);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const data = await request.GET(`/cms/quizzes/${quizId}/`);
        setQuizData(data);
        
        // Initialize expanded questions state
        const initialExpanded = {};
        data.questions?.forEach((q, idx) => {
          initialExpanded[idx] = false;
        });
        setExpandedQuestions(initialExpanded);
        
      } catch (err) {
        console.error("Failed to load quiz", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const toggleQuestionExpand = (index) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const expandAll = () => {
    const newExpanded = {};
    quizData.questions?.forEach((_, idx) => {
      newExpanded[idx] = true;
    });
    setExpandedQuestions(newExpanded);
  };

  const collapseAll = () => {
    const newExpanded = {};
    quizData.questions?.forEach((_, idx) => {
      newExpanded[idx] = false;
    });
    setExpandedQuestions(newExpanded);
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const getScoreColor = (score) => {
    if (score === null) return '#95a5a6';
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  const getScoreIcon = (score) => {
    if (score === null) return <MdStarOutline />;
    if (score >= 80) return <MdTrendingUp />;
    if (score >= 60) return <MdBarChart />;
    return <MdTrendingDown />;
  };

  if (loading) {
    return (
      <div className="qip-loading">
        <div className="qip-spinner"></div>
        <p>Loading quiz details...</p>
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="qip-error">
        <p>Error: {error || 'Quiz not found'}</p>
        <button onClick={() => navigate('/cms/courses')}>Back to Courses</button>
      </div>
    );
  }

  const stats = quizData.stats || {
    total_attempts: 0,
    completed_attempts: 0,
    average_score: null
  };

  return (
    <div className="qip-container">
      {/* Header */}
      <div className="qip-header">
        <button className="qip-back-btn" onClick={() => navigate(-1)}>
          <MdArrowBack /> Back
        </button>
        
        <div className="qip-title-section">
          <h1 className="qip-title">{quizData.title}</h1>
          <div className="qip-badge">
            <MdQuiz className="qip-badge-icon" />
            <span>Quiz ID: {quizId}</span>
          </div>
        </div>
        
        <div className="qip-course-info">
          <span className="qip-course-code">{quizData.course}</span>
          <span className="qip-duration">
            <MdAccessTime /> {quizData.time}
          </span>
        </div>
      </div>

      {/* Statistics Summary Cards */}
      <div className="qip-stats-grid">
        <div className="qip-stat-card">
          <div className="qip-stat-icon qip-stat-icon-attempts">
            <MdPeople />
          </div>
          <div className="qip-stat-content">
            <span className="qip-stat-label">Total Attempts</span>
            <span className="qip-stat-value">{stats.total_attempts || 0}</span>
          </div>
        </div>
        
        <div className="qip-stat-card">
          <div className="qip-stat-icon qip-stat-icon-completed">
            <MdCheckCircle />
          </div>
          <div className="qip-stat-content">
            <span className="qip-stat-label">Completed Attempts</span>
            <span className="qip-stat-value">{stats.completed_attempts || 0}</span>
          </div>
        </div>
        
        <div className="qip-stat-card">
          <div className="qip-stat-icon qip-stat-icon-score">
            <MdScore />
          </div>
          <div className="qip-stat-content">
            <span className="qip-stat-label">Average Score</span>
            <span className="qip-stat-value" style={{ color: getScoreColor(stats.average_score) }}>
              {stats.average_score !== null ? `${stats.average_score}%` : 'N/A'}
              {stats.average_score !== null && (
                <span className="qip-score-icon">{getScoreIcon(stats.average_score)}</span>
              )}
            </span>
          </div>
        </div>
        
        <div className="qip-stat-card">
          <div className="qip-stat-icon qip-stat-icon-questions">
            <MdQuiz />
          </div>
          <div className="qip-stat-content">
            <span className="qip-stat-label">Total Questions</span>
            <span className="qip-stat-value">{quizData.questions?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="qip-tabs">
        <button 
          className={`qip-tab ${activeTab === 'questions' ? 'qip-tab-active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          <MdVisibility /> Questions & Answers
        </button>
        <button 
          className={`qip-tab ${activeTab === 'stats' ? 'qip-tab-active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <MdBarChart /> Detailed Statistics
        </button>
      </div>

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="qip-questions-section">
          <div className="qip-questions-header">
            <h2>All Questions with Correct Answers</h2>
            <div className="qip-actions">
              <button className="qip-action-btn" onClick={expandAll}>
                <MdExpandMore /> Expand All
              </button>
              <button className="qip-action-btn" onClick={collapseAll}>
                <MdChevronRight /> Collapse All
              </button>
            </div>
          </div>

          <div className="qip-questions-list">
            {quizData.questions?.map((question, idx) => {
              const isExpanded = expandedQuestions[idx];
              const correctOptions = question.options.filter(opt => opt.is_correct === true);
              const isMultiple = question.multipleAnswers === "true";
              
              return (
                <div key={idx} className={`qip-question-card ${isExpanded ? 'qip-expanded' : ''}`}>
                  <div 
                    className="qip-question-header"
                    onClick={() => toggleQuestionExpand(idx)}
                  >
                    <div className="qip-question-number">
                      <span className="qip-question-num">Question {idx + 1}</span>
                      {isMultiple && (
                        <span className="qip-multiple-badge">Multiple Answers</span>
                      )}
                    </div>
                    <div className="qip-question-preview">
                      <div 
                        className="qip-question-text-preview"
                        dangerouslySetInnerHTML={{ __html: question.text }}
                      />
                    </div>
                    <button className="qip-expand-icon">
                      {isExpanded ? <MdExpandMore /> : <MdChevronRight />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="qip-question-details">
                      <div 
                        className="qip-full-question"
                        dangerouslySetInnerHTML={{ __html: question.text }}
                      />
                      
                      {question.image && (
                        <div className="qip-question-image">
                          <img src={question.image} alt="Question" />
                        </div>
                      )}

                      <div className="qip-options-section">
                        <h4>Options:</h4>
                        <div className="qip-options-list">
                          {question.options.map((option, optIdx) => {
                            const isCorrect = option.is_correct === true;
                            return (
                              <div 
                                key={optIdx} 
                                className={`qip-option-item ${isCorrect ? 'qip-option-correct' : ''}`}
                              >
                                <div className="qip-option-id">{option.id}.</div>
                                <div 
                                  className="qip-option-text"
                                  dangerouslySetInnerHTML={{ __html: option.text }}
                                />
                                {isCorrect && (
                                  <span className="qip-correct-badge">
                                    <MdCheckCircle /> Correct Answer
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="qip-answer-summary">
                        <div className="qip-answer-summary-header">
                          <MdCheckCircle className="qip-summary-icon" />
                          <strong>Correct Answer{correctOptions.length > 1 ? 's' : ''}:</strong>
                        </div>
                        <div className="qip-correct-answers">
                          {correctOptions.map((opt, i) => (
                            <span key={i} className="qip-correct-answer-badge">
                              {opt.id}. {opt.text.replace(/<[^>]*>/g, '').substring(0, 50)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="qip-stats-section">
          <div className="qip-stats-details">
            <h2>Quiz Performance Statistics</h2>
            
            <div className="qip-stats-details-grid">
              <div className="qip-detail-card">
                <h3>Attempt Statistics</h3>
                <div className="qip-detail-item">
                  <span>Total Attempts:</span>
                  <strong>{stats.total_attempts || 0}</strong>
                </div>
                <div className="qip-detail-item">
                  <span>Completed Attempts:</span>
                  <strong>{stats.completed_attempts || 0}</strong>
                </div>
                <div className="qip-detail-item">
                  <span>Completion Rate:</span>
                  <strong>
                    {stats.total_attempts > 0 
                      ? `${((stats.completed_attempts / stats.total_attempts) * 100).toFixed(1)}%`
                      : 'N/A'}
                  </strong>
                </div>
              </div>

              <div className="qip-detail-card">
                <h3>Score Statistics</h3>
                <div className="qip-detail-item">
                  <span>Average Score:</span>
                  <strong style={{ color: getScoreColor(stats.average_score) }}>
                    {stats.average_score !== null ? `${stats.average_score}%` : 'No data yet'}
                  </strong>
                </div>
                <div className="qip-detail-item">
                  <span>Highest Score:</span>
                  <strong>{stats.highest_score !== null ? `${stats.highest_score}%` : 'No data yet'}</strong>
                </div>
                <div className="qip-detail-item">
                  <span>Lowest Score:</span>
                  <strong>{stats.lowest_score !== null ? `${stats.lowest_score}%` : 'No data yet'}</strong>
                </div>
              </div>

              <div className="qip-detail-card">
                <h3>Question Statistics</h3>
                <div className="qip-detail-item">
                  <span>Total Questions:</span>
                  <strong>{quizData.questions?.length || 0}</strong>
                </div>
                <div className="qip-detail-item">
                  <span>Multiple Answer Questions:</span>
                  <strong>
                    {quizData.questions?.filter(q => q.multipleAnswers === "true").length || 0}
                  </strong>
                </div>
                <div className="qip-detail-item">
                  <span>Single Answer Questions:</span>
                  <strong>
                    {quizData.questions?.filter(q => q.multipleAnswers !== "true").length || 0}
                  </strong>
                </div>
              </div>
            </div>

            {/* Question Performance Table */}
            {stats.question_stats && stats.question_stats.length > 0 && (
              <div className="qip-question-performance">
                <h3>Question Performance</h3>
                <div className="qip-performance-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Question</th>
                        <th>Type</th>
                        <th>Correct Rate</th>
                        <th>Attempts</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.question_stats.map((qStat, idx) => (
                        <tr key={idx}>
                          <td className="qip-question-cell">
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: qStat.question_text || `Question ${idx + 1}`
                              }}
                            />
                          </td>
                          <td>
                            {qStat.multiple_answers ? 
                              <span className="qip-type-badge qip-type-multiple">Multiple</span> :
                              <span className="qip-type-badge qip-type-single">Single</span>
                            }
                          </td>
                          <td>
                            <div className="qip-correct-rate">
                              <div 
                                className="qip-rate-bar"
                                style={{ width: `${qStat.correct_rate || 0}%` }}
                              />
                              <span>{qStat.correct_rate?.toFixed(1) || 0}%</span>
                            </div>
                          </td>
                          <td>{qStat.attempts || 0}</td>
                          <td>
                            {qStat.correct_rate >= 70 ? (
                              <span className="qip-status-good">Good</span>
                            ) : qStat.correct_rate >= 50 ? (
                              <span className="qip-status-average">Average</span>
                            ) : (
                              <span className="qip-status-poor">Needs Review</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Export Button */}
            <div className="qip-export-section">
              <button className="qip-export-btn">
                <MdDownload /> Export Statistics (CSV)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizInstructorPage;

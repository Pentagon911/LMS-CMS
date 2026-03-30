// QuizPage.jsx (updated)

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import request from '../../../utils/requestMethods.jsx';
import './QuizPage.css';
import { MdAccessAlarms, MdUpload, MdWarning, MdSchedule, MdCheckCircle, MdCancel, MdClose } from 'react-icons/md';

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quizMetadata, setQuizMetadata] = useState(null);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState(null);

  const [quizData, setQuizData] = useState(null);
  const [quizState, setQuizState] = useState('loading');
  const [startTime, setStartTime] = useState(null);
  const [timeUntilStart, setTimeUntilStart] = useState(null);

  // Quiz taking state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef(null);
  const startTimerRef = useRef(null);

  // 1. Fetch only metadata on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setMetadataLoading(true);
        // Assuming an endpoint that returns only basic info
        // If not available, you could use the same endpoint and discard questions,
        // but that would still load questions. Here we assume a lightweight endpoint.
        const data = await request.GET(`/cms/quizzes/${quizId}/`);
        setQuizMetadata(data);

        // Determine quiz state based on start time
        const quizStartTime = data.startTime ? new Date(data.startTime) : null;
        setStartTime(quizStartTime);

        const now = new Date();
        if (quizStartTime && now < quizStartTime) {
          setQuizState('not_started');
          const timeDiff = quizStartTime - now;
          setTimeUntilStart(timeDiff);
        } else {
          setQuizState('ready_to_start');
        }
      } catch (err) {
        console.error("Failed to load quiz metadata", err);
        setMetadataError(err.message);
        setQuizState('error');
      } finally {
        setMetadataLoading(false);
      }
    };

    fetchMetadata();
  }, [quizId]);

  // Countdown timer for "not_started" state
  useEffect(() => {
    if (quizState !== 'not_started' || !timeUntilStart || timeUntilStart <= 0) return;

    startTimerRef.current = setInterval(() => {
      setTimeUntilStart(prev => {
        if (prev <= 1000) {
          clearInterval(startTimerRef.current);
          setQuizState('ready_to_start');
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(startTimerRef.current);
  }, [quizState, timeUntilStart]);

  // Timer for quiz duration (only when in progress)
  useEffect(() => {
    if (quizState !== 'in_progress' || timeRemaining === null || timeRemaining <= 0 || isSubmitted) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [quizState, timeRemaining, isSubmitted]);

  // Auto-submit when time runs out
  const handleAutoSubmit = () => {
    alert("Time's up! Your quiz will be submitted automatically.");
    calculateScore();
  };

  // Format time for countdown to start (mm:ss)
  const formatTimeUntilStart = (milliseconds) => {
    if (!milliseconds) return '--:--:--';
    const hours = Math.floor(milliseconds / 3600000);
    const mins = Math.floor((milliseconds % 3600000) / 60000);
    const secs = Math.floor((milliseconds % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format time for quiz timer (mm:ss or hh:mm:ss)
  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer selection
  const handleAnswerChange = (questionId, optionId, isMultiple) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      if (isMultiple) {
        const newAnswers = currentAnswers.includes(optionId)
          ? currentAnswers.filter(id => id !== optionId)
          : [...currentAnswers, optionId];
        return { ...prev, [questionId]: newAnswers };
      } else {
        return { ...prev, [questionId]: [optionId] };
      }
    });
  };

  const handleClearAnswer = () => {
    if (!quizData) return;
    const currentQuestion = quizData.questions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.questionId]: []
    }));
  };

  const goToNext = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  // Submit quiz to backend
  const calculateScore = async () => {
    clearInterval(timerRef.current);
    setIsSubmitted(true);
    setSubmitting(true);

    // Build answers array for submission
    const answersArray = Object.entries(answers).map(([questionId, selectedOptions]) => ({
      questionId: parseInt(questionId, 10),
      selectedOptions: selectedOptions.map(opt => opt.toString()) // ensure strings
    }));

    try {
      const response = await request.POST(`/cms/quizzes/${quizId}/submit/`, {
        answers: answersArray
      });

      // Store result in localStorage to prevent re-attempt
      localStorage.setItem(`quiz_${quizId}_attempted`, 'true');
      localStorage.setItem(`quiz_${quizId}_result`, JSON.stringify(response));

      setResult(response);
      setQuizState('completed');
    } catch (err) {
      console.error("Failed to submit quiz", err);
      alert("Submission failed. Please try again.");
      // Optionally allow retry
      setIsSubmitted(false);
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Start quiz: fetch full data and start timer
  const handleStartQuiz = async () => {
    try {
      setQuizState('loading');
      const fullQuiz = await request.GET(`/cms/quizzes/${quizId}/`);
      setQuizData(fullQuiz);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setQuizState('in_progress');

      // Parse duration from quizData.time (e.g., "15" or "15 minutes")
      const timeString = fullQuiz.time;
      let timeInSeconds;
      if (typeof timeString === 'string') {
        const minutes = parseInt(timeString);
        timeInSeconds = minutes * 60;
      } else {
        timeInSeconds = parseInt(timeString) * 60;
      }
      setTimeRemaining(timeInSeconds);
    } catch (err) {
      console.error("Failed to load quiz questions", err);
      alert("Could not load quiz. Please try again.");
      setQuizState('ready_to_start');
    }
  };

  // --- Render different states ---

  if (metadataLoading || (quizState === 'loading' && !quizData)) {
    return (
      <div className="quizsp-loading">
        <div className="quizsp-spinner"></div>
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (metadataError || (quizState === 'error')) {
    return (
      <div className="quizsp-error">
        <p>Error: {metadataError || 'Quiz not found'}</p>
        <button onClick={() => navigate('/cms/courses')}>Back to Courses</button>
      </div>
    );
  }

  // Not started state
  if (quizState === 'not_started') {
    const formattedStartTime = startTime ? startTime.toLocaleString() : 'Not scheduled';
    return (
      <div className="quizsp-not-started">
        <div className="quizsp-start-card">
          <h1>{quizMetadata?.title}</h1>
          <div className="quizsp-info-card">
            <div className="quizsp-info-row">
              <MdSchedule className="quizsp-info-icon" />
              <span>Starts: {formattedStartTime}</span>
            </div>
            <div className="quizsp-info-row">
              <MdAccessAlarms className="quizsp-info-icon" />
              <span>Duration: {quizMetadata?.time} minutes</span>
            </div>
            <div className="quizsp-info-row">
              <MdCheckCircle className="quizsp-info-icon" />
              <span>Questions: {quizMetadata?.questionsCount || 0}</span>
            </div>
            {timeUntilStart > 0 && (
              <div className="quizsp-info-row quizsp-countdown">
                <MdAccessAlarms className="quizsp-info-icon" />
                <span>Time until start: {formatTimeUntilStart(timeUntilStart)}</span>
              </div>
            )}
          </div>
          <button
            className="quizsp-start-btn"
            disabled={true}
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          >
            Quiz Not Started Yet
          </button>
          <button
            className="quizsp-back-btn"
            onClick={() => navigate('/cms/courses')}
            style={{ marginTop: '1rem' }}
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  // Ready to start state
  if (quizState === 'ready_to_start') {
    return (
      <div className="quizsp-ready">
        <div className="quizsp-start-card">
          <h1>{quizMetadata?.title}</h1>
          <div className="quizsp-info-card">
            <div className="quizsp-info-row">
              <MdAccessAlarms className="quizsp-info-icon" />
              <span>Duration: {quizMetadata?.time} minutes</span>
            </div>
            <div className="quizsp-info-row">
              <MdCheckCircle className="quizsp-info-icon" />
              <span>Questions: {quizMetadata?.questionsCount || 0}</span>
            </div>
            <div className="quizsp-info-row">
              <MdWarning className="quizsp-info-icon" />
              <span>Once started, you cannot pause the quiz</span>
            </div>
          </div>
          <button className="quizsp-start-btn" onClick={handleStartQuiz}>
            Start Quiz Now
          </button>
          <button
            className="quizsp-back-btn"
            onClick={() => navigate('/cms/courses')}
            style={{ marginTop: '1rem' }}
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (quizState === 'completed' && result) {
    return (
      <div className="quizsp-results">
        <div className="quizsp-results-card">
          <h1>Quiz Results</h1>
          <div className="quizsp-score-summary">
            <div className="quizsp-score-circle">
              <span className="quizsp-score-percentage">{result.percentage}</span>
              <span className="quizsp-score-label">Score</span>
            </div>
            <div className="quizsp-score-stats">
              <div className="quizsp-stat-item">
                <span className="quizsp-stat-label">Points Earned:</span>
                <span className="quizsp-stat-value">{result.points_earned} / {result.total_points}</span>
              </div>
              <div className="quizsp-stat-item">
                <span className="quizsp-stat-label">Submitted:</span>
                <span className="quizsp-stat-value">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
          <button className="quizsp-back-btn" onClick={() => navigate('/cms/courses')}>
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  // In-progress state – display questions
  if (quizState === 'in_progress' && quizData) {
    const currentQuestion = quizData.questions[currentQuestionIndex];
    const isMultiple = currentQuestion.multipleAnswers === "true";
    const currentAnswers = answers[currentQuestion.questionId] || [];
    const totalQuestions = quizData.questions.length;
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="quizsp-container">
        <div className="quizsp-header">
          <div className="quizsp-info">
            <h1>{quizData.title}</h1>
            <p className="quizsp-course">{quizData.course}</p>
          </div>
          <div className={`quizsp-timer ${timeRemaining < 60 ? 'quizsp-timer-warning' : ''}`}>
            <span className="quizsp-timer-icon"><MdAccessAlarms /></span>
            <span className="quizsp-timer-time">{formatTime(timeRemaining)}</span>
          </div>
        </div>

        <div className="quizsp-main">
          <div className="quizsp-question-area">
            <div className="quizsp-question-header">
              <span className="quizsp-question-number">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              {isMultiple && (
                <span className="quizsp-multiple-badge">✓ Multiple answers allowed</span>
              )}
            </div>

            <div
              className="quizsp-question-text"
              dangerouslySetInnerHTML={{ __html: currentQuestion.text }}
            />

            {currentQuestion.image && (
              <div className="quizsp-question-image">
                <img src={request.getBaseUrl() + currentQuestion.image} alt="Question" />
              </div>
            )}

            <div className="quizsp-options">
              {currentQuestion.options.map((option) => (
                <label
                  key={option.id}
                  className={`quizsp-option-item ${isMultiple ? 'quizsp-multiple' : 'quizsp-single'}`}
                >
                  <input
                    type={isMultiple ? 'checkbox' : 'radio'}
                    name={`question-${currentQuestion.questionId}`}
                    value={option.id}
                    checked={currentAnswers.includes(option.id)}
                    onChange={() => handleAnswerChange(
                      currentQuestion.questionId,
                      option.id,
                      isMultiple
                    )}
                    disabled={isSubmitted}
                  />
                  <span className="quizsp-option-id">{option.id}.</span>
                  <span
                    className="quizsp-option-text"
                    dangerouslySetInnerHTML={{ __html: option.text }}
                  />
                </label>
              ))}
            </div>

            <div className="quizsp-question-actions">
              <button
                className="quizsp-clear-btn"
                onClick={handleClearAnswer}
                disabled={isSubmitted || currentAnswers.length === 0}
              >
                🗑️ Clear Answer
              </button>

              <div className="quizsp-nav-buttons">
                <button
                  className="quizsp-nav-btn"
                  onClick={goToPrevious}
                  disabled={currentQuestionIndex === 0 || isSubmitted}
                >
                  ← Previous
                </button>

                {currentQuestionIndex === totalQuestions - 1 ? (
                  <button
                    className="quizsp-submit-btn"
                    onClick={() => setShowConfirmSubmit(true)}
                    disabled={isSubmitted || submitting}
                  >
                    <MdUpload /> {submitting ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                ) : (
                  <button
                    className="quizsp-nav-btn"
                    onClick={goToNext}
                    disabled={isSubmitted}
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="quizsp-sidebar">
            <h3>Questions</h3>
            <div className="quizsp-progress-info">
              <span>Answered: {answeredCount}/{totalQuestions}</span>
              <div className="quizsp-progress-bar">
                <div
                  className="quizsp-progress-fill"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="quizsp-question-grid">
              {quizData.questions.map((q, index) => {
                const isAnswered = answers[q.questionId]?.length > 0;
                const isCurrent = index === currentQuestionIndex;

                return (
                  <button
                    key={q.questionId}
                    className={`quizsp-badge ${isAnswered ? 'quizsp-badge-answered' : ''} ${isCurrent ? 'quizsp-badge-current' : ''}`}
                    onClick={() => goToQuestion(index)}
                    disabled={isSubmitted}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="quizsp-legend">
              <div className="quizsp-legend-item">
                <span className="quizsp-legend-dot quizsp-legend-current"></span>
                <span>Current</span>
              </div>
              <div className="quizsp-legend-item">
                <span className="quizsp-legend-dot quizsp-legend-answered"></span>
                <span>Answered</span>
              </div>
              <div className="quizsp-legend-item">
                <span className="quizsp-legend-dot quizsp-legend-unanswered"></span>
                <span>Unanswered</span>
              </div>
            </div>

            <button
              className="quizsp-submit-quiz-btn"
              onClick={() => setShowConfirmSubmit(true)}
              disabled={isSubmitted || submitting}
            >
              <MdUpload /> {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </div>

        {showConfirmSubmit && (
          <div className="quizsp-modal-overlay" onClick={() => setShowConfirmSubmit(false)}>
            <div className="quizsp-modal-content" onClick={e => e.stopPropagation()}>
              <h3>Submit Quiz?</h3>
              <p>You have answered {answeredCount} out of {totalQuestions} questions.</p>
              {answeredCount < totalQuestions && (
                <p className="quizsp-warning-text">
                  <MdWarning /> {totalQuestions - answeredCount} question(s) unanswered
                </p>
              )}
              <div className="quizsp-modal-actions">
                <button
                  className="quizsp-modal-cancel"
                  onClick={() => setShowConfirmSubmit(false)}
                >
                  Cancel
                </button>
                <button
                  className="quizsp-modal-confirm"
                  onClick={() => {
                    setShowConfirmSubmit(false);
                    calculateScore();
                  }}
                >
                  Yes, Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback (should not reach)
  return null;
};

export default QuizPage;

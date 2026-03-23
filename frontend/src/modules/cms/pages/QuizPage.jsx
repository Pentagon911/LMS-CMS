import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import request from '../../../utils/requestMethods.jsx';
import './QuizPage.css';
import { MdAccessAlarms, MdUpload, MdWarning, MdSchedule, MdCheckCircle, MdCancel, MdClose } from 'react-icons/md';

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizState, setQuizState] = useState('loading');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [result, setResult] = useState(null);
  
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const data = await request.GET(`/_data/quizzes/${quizId}.json`);
        setQuizData(data);
        
        const attempted = localStorage.getItem(`quiz_${quizId}_attempted`);
        const savedResult = localStorage.getItem(`quiz_${quizId}_result`);
        
        if (savedResult) {
          setQuizState('completed');
          setResult(JSON.parse(savedResult));
          setLoading(false);
          return;
        }
        
        if (attempted === 'true') {
          setQuizState('completed');
          setLoading(false);
          return;
        }
        
        const now = new Date();
        const startTime = data.startTime ? new Date(data.startTime) : null;
        
        if (startTime && now < startTime) {
          setQuizState('not_started');
        } else {
          setQuizState('in_progress');
          const timeString = data.time;
          const timeInSeconds = parseInt(timeString) * 60;
          setTimeRemaining(timeInSeconds);
        }
        
      } catch (err) {
        console.error("Failed to load quiz", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

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

  const handleAutoSubmit = () => {
    alert("Time's up! Your quiz will be submitted automatically.");
    calculateScore();
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  const calculateScore = () => {
    clearInterval(timerRef.current);
    setIsSubmitted(true);
    
    let correctCount = 0;
    let earnedPoints = 0;
    let totalPoints = 0;
    
    const results = quizData.questions.map(question => {
      const userAnswers = answers[question.questionId] || [];
      const correctAnswers = question.options
        .filter(opt => opt.is_correct === "true")
        .map(opt => opt.id);
      
      const isCorrect = userAnswers.length === correctAnswers.length &&
        userAnswers.every(id => correctAnswers.includes(id));
      
      const points = question.points || 1;
      totalPoints += points;
      if (isCorrect) {
        earnedPoints += points;
        correctCount++;
      }
      
      return {
        questionId: question.questionId,
        question: question.question,
        userAnswers,
        correctAnswers,
        isCorrect,
        points: isCorrect ? points : 0,
        maxPoints: points
      };
    });
    
    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    
    const finalResult = {
      score: earnedPoints,
      totalPoints: totalPoints,
      percentage: percentage.toFixed(1),
      correctCount,
      totalQuestions: quizData.questions.length,
      results,
      submittedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`quiz_${quizId}_attempted`, 'true');
    localStorage.setItem(`quiz_${quizId}_result`, JSON.stringify(finalResult));
    
    setResult(finalResult);
    setQuizState('completed');
  };

  const handleStartQuiz = () => {
    setQuizState('in_progress');
    setAnswers({});
    setCurrentQuestionIndex(0);
    const timeString = quizData.time;
    const timeInSeconds = parseInt(timeString) * 60;
    setTimeRemaining(timeInSeconds);
  };

  if (loading) {
    return (
      <div className="quiz-page-loading">
        <div className="quiz-page-spinner"></div>
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="quiz-page-error">
        <p>Error: {error || 'Quiz not found'}</p>
        <button onClick={() => navigate('/cms/courses')}>Back to Courses</button>
      </div>
    );
  }

  // Not Started State
  if (quizState === 'not_started') {
    const startTime = new Date(quizData.startTime);
    return (
      <div className="quiz-page-not-started">
        <div className="quiz-page-start-card">
          <h1>{quizData.title}</h1>
          <div className="quiz-page-info-card">
            <div className="quiz-page-info-row">
              <MdSchedule className="quiz-page-info-icon" />
              <span>Starts: {startTime.toLocaleString()}</span>
            </div>
            <div className="quiz-page-info-row">
              <MdAccessAlarms className="quiz-page-info-icon" />
              <span>Duration: {quizData.time}</span>
            </div>
            <div className="quiz-page-info-row">
              <MdCheckCircle className="quiz-page-info-icon" />
              <span>Questions: {quizData.questions?.length || 0}</span>
            </div>
          </div>
          <button className="quiz-page-start-btn" onClick={handleStartQuiz}>
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // Completed State - Show Results
  if (quizState === 'completed' && result) {
    return (
      <div className="quiz-page-results">
        <div className="quiz-page-results-card">
          <h1>Quiz Results</h1>
          <div className="quiz-page-score-summary">
            <div className="quiz-page-score-circle">
              <span className="quiz-page-score-percentage">{result.percentage}%</span>
              <span className="quiz-page-score-label">Score</span>
            </div>
            <div className="quiz-page-score-stats">
              <div className="quiz-page-stat-item">
                <span className="quiz-page-stat-label">Correct Answers:</span>
                <span className="quiz-page-stat-value">{result.correctCount} / {result.totalQuestions}</span>
              </div>
              <div className="quiz-page-stat-item">
                <span className="quiz-page-stat-label">Points Earned:</span>
                <span className="quiz-page-stat-value">{result.score} / {result.totalPoints}</span>
              </div>
              <div className="quiz-page-stat-item">
                <span className="quiz-page-stat-label">Submitted:</span>
                <span className="quiz-page-stat-value">{new Date(result.submittedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="quiz-page-review">
            <h2>Review Answers</h2>
            {result.results.map((q, idx) => (
              <div key={idx} className={`quiz-page-review-item ${q.isCorrect ? 'quiz-page-correct' : 'quiz-page-incorrect'}`}>
                <div className="quiz-page-review-header">
                  <span className="quiz-page-review-number">Question {idx + 1}</span>
                  <span className={`quiz-page-review-status ${q.isCorrect ? 'quiz-page-status-correct' : 'quiz-page-status-incorrect'}`}>
                    {q.isCorrect ? <MdCheckCircle /> : <MdCancel />}
                    {q.isCorrect ? ' Correct' : ' Incorrect'}
                  </span>
                </div>
                <div className="quiz-page-review-question" dangerouslySetInnerHTML={{ __html: q.question }} />
                <div className="quiz-page-review-answers">
                  <div className="quiz-page-your-answer">
                    <strong>Your Answer:</strong> {q.userAnswers.length > 0 ? q.userAnswers.join(', ') : 'Not answered'}
                  </div>
                  <div className="quiz-page-correct-answer">
                    <strong>Correct Answer:</strong> {q.correctAnswers.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="quiz-page-back-btn" onClick={() => navigate('/cms/courses')}>
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  // In Progress State
  const currentQuestion = quizData.questions[currentQuestionIndex];
  const isMultiple = currentQuestion.multipleAnswers === "true";
  const currentAnswers = answers[currentQuestion.questionId] || [];
  const totalQuestions = quizData.questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="quiz-page-container">
      <div className="quiz-page-header">
        <div className="quiz-page-info">
          <h1>{quizData.title}</h1>
          <p className="quiz-page-course">{quizData.course}</p>
        </div>
        <div className={`quiz-page-timer ${timeRemaining < 60 ? 'quiz-page-timer-warning' : ''}`}>
          <span className="quiz-page-timer-icon"><MdAccessAlarms /></span>
          <span className="quiz-page-timer-time">{formatTime(timeRemaining)}</span>
        </div>
      </div>

      <div className="quiz-page-main">
        <div className="quiz-page-question-area">
          <div className="quiz-page-question-header">
            <span className="quiz-page-question-number">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            {isMultiple && (
              <span className="quiz-page-multiple-badge">✓ Multiple answers allowed</span>
            )}
          </div>

          <div 
            className="quiz-page-question-text"
            dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
          />

          {currentQuestion.image && (
            <div className="quiz-page-question-image">
              <img src={currentQuestion.image} alt="Question" />
            </div>
          )}

          <div className="quiz-page-options">
            {currentQuestion.options.map((option) => (
              <label 
                key={option.id} 
                className={`quiz-page-option-item ${isMultiple ? 'quiz-page-multiple' : 'quiz-page-single'}`}
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
                <span className="quiz-page-option-id">{option.id}.</span>
                <span 
                  className="quiz-page-option-text"
                  dangerouslySetInnerHTML={{ __html: option.text }}
                />
              </label>
            ))}
          </div>

          <div className="quiz-page-question-actions">
            <button 
              className="quiz-page-clear-btn"
              onClick={handleClearAnswer}
              disabled={isSubmitted || currentAnswers.length === 0}
            >
              🗑️ Clear Answer
            </button>
            
            <div className="quiz-page-nav-buttons">
              <button 
                className="quiz-page-nav-btn"
                onClick={goToPrevious}
                disabled={currentQuestionIndex === 0 || isSubmitted}
              >
                ← Previous
              </button>
              
              {currentQuestionIndex === totalQuestions - 1 ? (
                <button 
                  className="quiz-page-submit-btn"
                  onClick={() => setShowConfirmSubmit(true)}
                  disabled={isSubmitted}
                >
                  <MdUpload /> Submit Quiz
                </button>
              ) : (
                <button 
                  className="quiz-page-nav-btn"
                  onClick={goToNext}
                  disabled={isSubmitted}
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="quiz-page-sidebar">
          <h3>Questions</h3>
          <div className="quiz-page-progress-info">
            <span>Answered: {answeredCount}/{totalQuestions}</span>
            <div className="quiz-page-progress-bar">
              <div 
                className="quiz-page-progress-fill"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="quiz-page-question-grid">
            {quizData.questions.map((q, index) => {
              const isAnswered = answers[q.questionId]?.length > 0;
              const isCurrent = index === currentQuestionIndex;
              
              return (
                <button
                  key={q.questionId}
                  className={`quiz-page-badge ${isAnswered ? 'quiz-page-badge-answered' : ''} ${isCurrent ? 'quiz-page-badge-current' : ''}`}
                  onClick={() => goToQuestion(index)}
                  disabled={isSubmitted}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className="quiz-page-legend">
            <div className="quiz-page-legend-item">
              <span className="quiz-page-legend-dot quiz-page-legend-current"></span>
              <span>Current</span>
            </div>
            <div className="quiz-page-legend-item">
              <span className="quiz-page-legend-dot quiz-page-legend-answered"></span>
              <span>Answered</span>
            </div>
            <div className="quiz-page-legend-item">
              <span className="quiz-page-legend-dot quiz-page-legend-unanswered"></span>
              <span>Unanswered</span>
            </div>
          </div>

          <button 
            className="quiz-page-submit-quiz-btn"
            onClick={() => setShowConfirmSubmit(true)}
            disabled={isSubmitted}
          >
            <MdUpload /> Submit Quiz
          </button>
        </div>
      </div>

      {showConfirmSubmit && (
        <div className="quiz-page-modal-overlay" onClick={() => setShowConfirmSubmit(false)}>
          <div className="quiz-page-modal-content" onClick={e => e.stopPropagation()}>
            <h3>Submit Quiz?</h3>
            <p>You have answered {answeredCount} out of {totalQuestions} questions.</p>
            {answeredCount < totalQuestions && (
              <p className="quiz-page-warning-text">
                <MdWarning /> {totalQuestions - answeredCount} question(s) unanswered
              </p>
            )}
            <div className="quiz-page-modal-actions">
              <button 
                className="quiz-page-modal-cancel"
                onClick={() => setShowConfirmSubmit(false)}
              >
                Cancel
              </button>
              <button 
                className="quiz-page-modal-confirm"
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
};

export default QuizPage;

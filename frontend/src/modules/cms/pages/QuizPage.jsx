import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import request from '../../../utils/requestMethods.jsx';
import './QuizPage.css';
import { MdAccessAlarms, MdAccessTime, MdUpload, MdWarning } from 'react-icons/md';

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  
  const timerRef = useRef(null);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        // In real app: const data = await request.GET(`/api/quizzes/${quizId}`);
        // For now, using mock data
        const data = await request.GET('/_data/quizzes/quiz002.json');
        setQuizData(data);
        
        // Parse time (e.g., "10m" to seconds)
        const timeString = data.time;
        const timeInSeconds = parseInt(timeString) * 60;
        setTimeRemaining(timeInSeconds);
        
      } catch (err) {
        console.error("Failed to load quiz", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || isSubmitted) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Auto-submit when time runs out
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeRemaining, isSubmitted]);

  const handleAutoSubmit = () => {
    alert("Time's up! Your quiz will be submitted automatically.");
    handleSubmit(true);
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer selection
  const handleAnswerChange = (questionId, optionId, isMultiple) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      
      if (isMultiple) {
        // Multiple answers - toggle selection
        const newAnswers = currentAnswers.includes(optionId)
          ? currentAnswers.filter(id => id !== optionId)
          : [...currentAnswers, optionId];
        
        return {
          ...prev,
          [questionId]: newAnswers
        };
      } else {
        // Single answer - replace
        return {
          ...prev,
          [questionId]: [optionId]
        };
      }
    });
  };

  // Clear answer for current question
  const handleClearAnswer = () => {
    if (!quizData) return;
    
    const currentQuestion = quizData.questions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.questionId]: []
    }));
  };

  // Navigation
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

  // Submit quiz
  const handleSubmit = (isAuto = false) => {
    if (!isAuto && !window.confirm('Are you sure you want to submit your quiz?')) {
      return;
    }

    clearInterval(timerRef.current);
    setIsSubmitted(true);

    // Prepare submission data
    const submission = {
      quizId: quizData.quizId,
      answers: Object.entries(answers).map(([questionId, selectedOptions]) => ({
        questionId,
        selectedOptions
      })),
      timeSpent: quizData.time - Math.floor(timeRemaining / 60),
      submittedAt: new Date().toISOString()
    };

    console.log("Quiz submission:", submission);
    
    // In real app: await request.POST('/api/quizzes/submit', submission);
    
    // Show success message
    alert('Quiz submitted successfully!');
    
    // Navigate back to dashboard after a delay
    setTimeout(() => {
      navigate('/cms/dashboard');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="quiz-loading">
        <div className="loading-spinner"></div>
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="quiz-error">
        <p>Error: {error || 'Quiz not found'}</p>
        <button onClick={() => navigate('/cms/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const isMultiple = currentQuestion.multipleAnswers === "true";
  const currentAnswers = answers[currentQuestion.questionId] || [];
  const totalQuestions = quizData.questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="quiz-container">
      {/* Header with Timer */}
      <div className="quiz-header">
        <div className="quiz-info">
          <h1>{quizData.title}</h1>
          <p className="quiz-course">{quizData.course}</p>
        </div>
        <div className={`quiz-timer ${timeRemaining < 60 ? 'timer-warning' : ''}`}>
          <span className="timer-icon"><MdAccessAlarms /></span>
          <span className="timer-time">{formatTime(timeRemaining)}</span>
        </div>
      </div>

      {/* Main Quiz Area */}
      <div className="quiz-main">
        {/* Question Area */}
        <div className="question-area">
          <div className="question-header">
            <span className="question-number">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            {isMultiple && (
              <span className="multiple-badge">✓ Multiple answers allowed</span>
            )}
          </div>

          {/* FIXED: dangerouslySetInnerHTML as object */}
          <div 
            className="question-text"
            dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
          />

          {currentQuestion.image && (
            <div className="question-image">
              <img src={currentQuestion.image} alt="Question" />
            </div>
          )}

          <div className="options-container">
            {currentQuestion.options.map((option) => (
              <label 
                key={option.id} 
                className={`option-item ${isMultiple ? 'multiple' : 'single'}`}
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
                <span className="option-id">{option.id}.</span>
                {/* FIXED: dangerouslySetInnerHTML as object */}
                <span 
                  className="option-text"
                  dangerouslySetInnerHTML={{ __html: option.text }}
                />
              </label>
            ))}
          </div>

          {/* Question Actions */}
          <div className="question-actions">
            <button 
              className="clear-btn"
              onClick={handleClearAnswer}
              disabled={isSubmitted || currentAnswers.length === 0}
            >
              🗑️ Clear Answer
            </button>
            
            <div className="nav-buttons">
              <button 
                className="nav-btn"
                onClick={goToPrevious}
                disabled={currentQuestionIndex === 0 || isSubmitted}
              >
                ← Previous
              </button>
              
              {currentQuestionIndex === totalQuestions - 1 ? (
                <button 
                  className="submit-btn"
                  onClick={() => setShowConfirmSubmit(true)}
                  disabled={isSubmitted}
                >
                  <MdUpload /> Submit Quiz
                </button>
              ) : (
                <button 
                  className="nav-btn"
                  onClick={goToNext}
                  disabled={isSubmitted}
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigator Sidebar */}
        <div className="navigator-sidebar">
          <h3>Questions</h3>
          <div className="progress-info">
            <span>Answered: {answeredCount}/{totalQuestions}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="question-grid">
            {quizData.questions.map((q, index) => {
              const isAnswered = answers[q.questionId]?.length > 0;
              const isCurrent = index === currentQuestionIndex;
              
              return (
                <button
                  key={q.questionId}
                  className={`question-badge ${isAnswered ? 'answered' : ''} ${isCurrent ? 'current' : ''}`}
                  onClick={() => goToQuestion(index)}
                  disabled={isSubmitted}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className="legend">
            <div className="legend-item">
              <span className="legend-dot current"></span>
              <span>Current</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot answered"></span>
              <span>Answered</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot unanswered"></span>
              <span>Unanswered</span>
            </div>
          </div>

          <button 
            className="submit-quiz-btn"
            onClick={() => setShowConfirmSubmit(true)}
            disabled={isSubmitted}
          >
            <MdUpload /> Submit Quiz
          </button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="modal-overlay" onClick={() => setShowConfirmSubmit(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Submit Quiz?</h3>
            <p>You have answered {answeredCount} out of {totalQuestions} questions.</p>
            {answeredCount < totalQuestions && (
              <p className="warning-text">
                <MdWarning /> {totalQuestions - answeredCount} question(s) unanswered
              </p>
            )}
            <div className="modal-actions">
              <button 
                className="modal-cancel"
                onClick={() => setShowConfirmSubmit(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-confirm"
                onClick={() => {
                  setShowConfirmSubmit(false);
                  handleSubmit();
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

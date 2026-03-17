import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import request from '../../../utils/requestMethods.jsx';
import QuizEditor from '../components/QuizEditor.jsx';
import './Quiz.css';

const CreateQuizPage = () => {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const [mode, setMode] = useState('select');
  const [existingQuizzes, setExistingQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [user, setUser] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [quizData, setQuizData] = useState({
    quizId: '',
    title: '',
    course: '',
    moduleTitle: '',
    time: '15m',
    questions: []
  });

  // Get user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error("Failed to parse user", err);
      }
    }
  }, []);

  // Fetch all modules from moduleCard.json
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const data = await request.GET('/_data/moduleCard.json');
        console.log("Modules loaded:", data);
        setModules(data);
      } catch (err) {
        console.error('Failed to fetch modules', err);
      }
    };

    fetchModules();
  }, []);

  // Fetch existing quizzes
  const fetchExistingQuizzes = async () => {
    try {
      setLoading(true);
      const data = await request.GET('/_data/quizzes.json');
      setExistingQuizzes(data);
    } catch (err) {
      console.error('Failed to fetch quizzes', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch existing quizzes on component mount
  useEffect(() => {
    fetchExistingQuizzes();
  }, []);

  // Load quiz for editing when quizId is provided
  useEffect(() => {
    if (quizId && mode === 'select') {
      loadQuizForEdit(quizId);
    }
  }, [quizId, mode]);

  const loadQuizForEdit = async (id) => {
    try {
      setLoading(true);
      let quizToLoad;
      const data = await request.GET(`/_data/quizzes/${id}.json`);
      if (data) quizToLoad = data;

      // Find module title from modules array
      const moduleInfo = modules.find(m => m.code === quizToLoad.course);
      
      setQuizData({
        ...quizToLoad,
        moduleTitle: moduleInfo?.title || ''
      });
      setSelectedModule(quizToLoad.course);
      setSelectedQuiz(quizToLoad);
      setMode('edit');
    } catch (err) {
      console.error('Failed to load quiz', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    loadQuizForEdit(quiz.quizId);
  };

  const handleCreateNew = () => {
    setQuizData({
      quizId: `quiz${Date.now()}`,
      title: '',
      course: '',
      moduleTitle: '',
      time: '15m',
      questions: []
    });
    setSelectedModule('');
    setCurrentQuestionIndex(null);
    setIsEditingQuestion(false);
    setMode('create');
  };

  const handleModuleChange = (e) => {
    const course = e.target.value;
    setSelectedModule(course);
    
    // Find module title from modules array
    const moduleInfo = modules.find(m => m.code === course);
    
    setQuizData({
      ...quizData,
      course: course,
      moduleTitle: moduleInfo?.title || ''
    });
  };

  // Handle adding a new question
  const handleAddQuestion = () => {
    setCurrentQuestionIndex(null);
    setIsEditingQuestion(false);
  };

  // Handle editing an existing question
  const handleEditQuestion = (index) => {
    console.log("Editing question at index:", index);
    console.log("Question data:", quizData.questions[index]);
    setCurrentQuestionIndex(index);
    setIsEditingQuestion(true);
    
    // Scroll to editor
    setTimeout(() => {
      document.querySelector('.quiz-editor-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle submitting from QuizEditor (for both new and edited questions)
  const handleQuizEditorSubmit = (questionData) => {
    console.log('Received from QuizEditor:', questionData);
    
    const updatedQuestion = {
      questionId: isEditingQuestion && currentQuestionIndex !== null 
        ? quizData.questions[currentQuestionIndex].questionId 
        : `q${quizData.questions.length + 1}`,
      question: questionData.question,
      image: null,
      multipleAnswers: questionData.multipleAnswers || 'false',
      options: questionData.options.map((opt, idx) => ({
        id: String.fromCharCode(65 + idx),
        text: opt
      })),
      correctAnswer: questionData.correctAnswer,
      equationPreview: questionData.equationPreview
    };

    let updatedQuestions;
    
    if (isEditingQuestion && currentQuestionIndex !== null) {
      // Update existing question
      updatedQuestions = [...quizData.questions];
      updatedQuestions[currentQuestionIndex] = updatedQuestion;
    } else {
      // Add new question
      updatedQuestions = [...quizData.questions, updatedQuestion];
    }

    setQuizData({
      ...quizData,
      questions: updatedQuestions
    });

    // Reset editing state
    setCurrentQuestionIndex(null);
    setIsEditingQuestion(false);
  };

  // Handle removing a question
  const handleRemoveQuestion = (index) => {
    if (window.confirm('Are you sure you want to remove this question?')) {
      const updatedQuestions = quizData.questions.filter((_, i) => i !== index);
      
      // Reassign question IDs
      updatedQuestions.forEach((q, idx) => {
        q.questionId = `q${idx + 1}`;
      });
      
      setQuizData({
        ...quizData,
        questions: updatedQuestions
      });

      // Reset editing state if we were editing the removed question
      if (currentQuestionIndex === index) {
        setCurrentQuestionIndex(null);
        setIsEditingQuestion(false);
      }
    }
  };

  // Handle moving questions up/down
  const handleMoveQuestion = (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === quizData.questions.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedQuestions = [...quizData.questions];
    [updatedQuestions[index], updatedQuestions[newIndex]] = [updatedQuestions[newIndex], updatedQuestions[index]];
    
    // Reassign question IDs
    updatedQuestions.forEach((q, idx) => {
      q.questionId = `q${idx + 1}`;
    });

    setQuizData({
      ...quizData,
      questions: updatedQuestions
    });

    // Update current question index if we were editing this question
    if (currentQuestionIndex === index) {
      setCurrentQuestionIndex(newIndex);
    } else if (currentQuestionIndex === newIndex) {
      setCurrentQuestionIndex(index);
    }
  };

  const saveQuiz = async () => {
    if (!quizData.title) {
      alert('Please enter a quiz title');
      return;
    }

    if (!selectedModule) {
      alert('Please select a module');
      return;
    }

    if (quizData.questions.length === 0) {
      alert('Please add at least one question using the Quiz Editor');
      return;
    }

    try {
      setLoading(true);
      const moduleInfo = modules.find(m => m.code === selectedModule);
      
      const finalQuizData = {
        ...quizData,
        course: selectedModule,
        moduleTitle: moduleInfo?.title || '',
        moduleColor: moduleInfo?.color || '#228be6',
        createdBy: user?.email || 'unknown',
        createdAt: new Date().toISOString()
      };
      
      console.log('Saving quiz:', finalQuizData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Quiz saved successfully!');
      navigate('/cms/courses');
    } catch (err) {
      console.error('Failed to save quiz', err);
      alert('Failed to save quiz');
    } finally {
      setLoading(false);
    }
  };

  const getModuleTitle = (code) => {
    const module = modules.find(m => m.code === code);
    return module ? module.title : code;
  };

  const getModuleColor = (code) => {
    const module = modules.find(m => m.code === code);
    return module ? module.color : '#228be6';
  };

  // Selection screen
  if (mode === 'select') {
    return (
      <div className="quiz-creator-container">
        <div className="quiz-creator-header">
          <button className="back-btn" onClick={() => navigate('/cms/courses')}>
            ← Back to Courses
          </button>
          <h1>Quiz Manager</h1>
        </div>

        <div className="selection-panel">
          <button className="create-new-btn" onClick={handleCreateNew}>
            <span className="plus-icon">+</span>
            Create New Quiz
          </button>

          <div className="existing-quizzes">
            <h2>Edit Existing Quiz</h2>
            {loading ? (
              <div className="loading">Loading quizzes...</div>
            ) : (
              <div className="quiz-list">
                {existingQuizzes
                  .filter(quiz => !selectedModule || quiz.course === selectedModule)
                  .map(quiz => {
                    const moduleColor = getModuleColor(quiz.course);
                    return (
                      <div 
                        key={quiz.quizId} 
                        className="quiz-list-item"
                        onClick={() => handleSelectQuiz(quiz)}
                        style={{ borderLeftColor: moduleColor, borderLeftWidth: '4px', borderLeftStyle: 'solid' }}
                      >
                        <div className="quiz-item-info">
                          <span className="quiz-item-title">{quiz.title}</span>
                          <span className="quiz-item-course" style={{ color: moduleColor }}>
                            {quiz.course} - {getModuleTitle(quiz.course)}
                          </span>
                        </div>
                        <span className="quiz-item-time">{quiz.time}</span>
                        <span className="edit-icon">✎</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Module Filter */}
        <div className="module-filter">
          <label>Filter by Module:</label>
          <select 
            value={selectedModule} 
            onChange={(e) => setSelectedModule(e.target.value)}
            className="module-select"
          >
            <option value="">All Modules</option>
            {modules.map(module => (
              <option key={module.code} value={module.code}>
                {module.code} - {module.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // Quiz creation/editing screen
  return (
    <div className="quiz-creator-container">
      <div className="quiz-creator-header">
        <button className="back-btn" onClick={() => setMode('select')}>
          ← Back to Quiz Selection
        </button>
        <h1>{mode === 'create' ? 'Create New Quiz' : 'Edit Quiz'}</h1>
      </div>

      <div className="quiz-form">
        {/* Module Selection */}
        <div className="module-selection-section">
          <label className="section-label">
            <span className="label-icon">📚</span>
            Select Module
          </label>
          <select 
            className="module-select-large"
            value={selectedModule}
            onChange={handleModuleChange}
            style={{ 
              borderColor: selectedModule ? getModuleColor(selectedModule) : '#ced4da',
              borderWidth: '2px'
            }}
          >
            <option value="">-- Choose a module --</option>
            {modules.map(module => (
              <option 
                key={module.code} 
                value={module.code}
                style={{ color: module.color }}
              >
                {module.code} - {module.title}
              </option>
            ))}
          </select>
          
          {selectedModule && (
            <div className="selected-module-indicator" style={{ color: getModuleColor(selectedModule) }}>
              ✓ Selected: {getModuleTitle(selectedModule)}
            </div>
          )}
        </div>

        {/* Quiz Metadata */}
        <div className="quiz-metadata">
          <div className="form-row">
            <div className="form-group">
              <label>Quiz Title</label>
              <input
                type="text"
                value={quizData.title}
                onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                placeholder="e.g., Data Structures Quiz"
              />
            </div>

            <div className="form-group">
              <label>Time Limit</label>
              <select
                value={quizData.time}
                onChange={(e) => setQuizData({ ...quizData, time: e.target.value })}
              >
                <option value="5m">5 minutes</option>
                <option value="10m">10 minutes</option>
                <option value="15m">15 minutes</option>
                <option value="20m">20 minutes</option>
                <option value="30m">30 minutes</option>
                <option value="45m">45 minutes</option>
                <option value="60m">60 minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions List */}
        {quizData.questions.length > 0 && (
          <div className="questions-list-section">
            <div className="section-header">
              <h3>Quiz Questions ({quizData.questions.length})</h3>
              <button className="add-question-btn" onClick={handleAddQuestion}>
                <span className="btn-icon">+</span> Add New Question
              </button>
            </div>
            <div className="questions-list">
              {quizData.questions.map((q, index) => (
                <div key={index} className="question-item">
                  <div className="question-item-header">
                    <div className="question-item-title">
                      <span className="question-number">Q{index + 1}.</span>
                      <div 
                        className="question-preview"
                        dangerouslySetInnerHTML={{ 
                          __html: q.question.length > 100 
                            ? q.question.substring(0, 100) + '...' 
                            : q.question 
                        }}
                      />
                    </div>
                    <div className="question-item-actions">
                      <span className="options-badge">{q.options.length} options</span>
                      <button 
                        className="move-btn" 
                        onClick={() => handleMoveQuestion(index, 'up')}
                        disabled={index === 0}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button 
                        className="move-btn" 
                        onClick={() => handleMoveQuestion(index, 'down')}
                        disabled={index === quizData.questions.length - 1}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button 
                        className="edit-btn"
                        onClick={() => handleEditQuestion(index)}
                        title="Edit question"
                      >
                        ✎
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleRemoveQuestion(index)}
                        title="Remove question"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  {currentQuestionIndex === index && (
                    <div className="editing-indicator">
                      <span className="editing-badge">Currently editing this question</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quiz Editor Integration */}
        <div className="quiz-editor-section">
          <div className="section-header">
            <h2>
              {isEditingQuestion && currentQuestionIndex !== null 
                ? `Edit Question ${currentQuestionIndex + 1}` 
                : 'Create New Question'}
            </h2>
            <p>
              {isEditingQuestion && currentQuestionIndex !== null 
                ? 'Modify the question details below' 
                : 'Use the editor below to create a new quiz question'}
            </p>
          </div>
          
          <QuizEditor 
            onSubmit={handleQuizEditorSubmit}
            initialData={isEditingQuestion && currentQuestionIndex !== null && quizData.questions[currentQuestionIndex]
              ? {
                  question: quizData.questions[currentQuestionIndex].question || '',
                  options: quizData.questions[currentQuestionIndex].options?.map(opt => opt.text) || ['', ''],
                  correctAnswer: quizData.questions[currentQuestionIndex].correctAnswer ?? null,
                  multipleAnswers: quizData.questions[currentQuestionIndex].multipleAnswers || 'false',
                  equationPreview: quizData.questions[currentQuestionIndex].equationPreview || ''
                }
              : null
            }
            key={isEditingQuestion && currentQuestionIndex !== null ? `edit-${currentQuestionIndex}` : 'new-question'}
          />
        </div>

        {/* Save Buttons */}
        <div className="form-actions">
          <button className="cancel-btn" onClick={() => setMode('select')}>
            Cancel
          </button>
          <button 
            className="save-btn" 
            onClick={saveQuiz} 
            disabled={loading}
            style={{
              backgroundColor: selectedModule ? getModuleColor(selectedModule) : '#228be6'
            }}
          >
            {loading ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateQuizPage;

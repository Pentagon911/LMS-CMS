import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import request from '../../../utils/requestMethods.jsx';
import QuizEditor from '../components/QuizEditor.jsx';
import './QuizEditor.css';
import { MdArrowDownward, MdArrowUpward, MdClose, MdEdit } from 'react-icons/md';

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
    createdAt: new Date().toISOString(),
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

  // Fetch all modules from API
  useEffect(() => {
    const fetchModules = async () => {
      try {
<<<<<<< HEAD
        setLoading(true);
=======
>>>>>>> b05018e57849741ed2c983d6e3a5305f58191b0a
        const data = await request.GET('/cms/courses/');
        setModules(data);
      } catch (err) {
        console.error('Failed to fetch modules', err);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  // Fetch existing quizzes
  const fetchExistingQuizzes = async () => {
    try {
      setLoading(true);
<<<<<<< HEAD
      // Using GET request to fetch all quizzes
      const data = await request.GET('/cms/quizzes/');
=======
      const data = await request.GET('/cms/quizzes/draft_quizzes/');
>>>>>>> b05018e57849741ed2c983d6e3a5305f58191b0a
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
<<<<<<< HEAD
      // Using GET request to fetch single quiz by ID
      const quizToLoad = await request.GET(`/cms/quizzes/${id}/`);
      
=======
      let quizToLoad;
      const data = await request.GET(`/cms/quizzes/${id}/`);
      if (data) quizToLoad = data;

>>>>>>> b05018e57849741ed2c983d6e3a5305f58191b0a
      const moduleInfo = modules.find(m => m.code === quizToLoad.course);
      
      setQuizData({
        ...quizToLoad,
        moduleTitle: moduleInfo?.title || '',
        createdAt: quizToLoad.createdAt || new Date().toISOString()
      });
      setSelectedModule(quizToLoad.course);
      setSelectedQuiz(quizToLoad);
      setMode('edit');
    } catch (err) {
      console.error('Failed to load quiz', err);
      alert('Failed to load quiz. Please try again.');
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
      createdAt: new Date().toISOString(),
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
    
    const moduleInfo = modules.find(m => m.code === course);
    
    setQuizData({
      ...quizData,
      course: course,
      moduleTitle: moduleInfo?.title || ''
    });
  };

  const handleAddQuestion = () => {
    setCurrentQuestionIndex(null);
    setIsEditingQuestion(false);
  };

  const handleEditQuestion = (index) => {
    setCurrentQuestionIndex(index);
    setIsEditingQuestion(true);
    
    setTimeout(() => {
      document.querySelector('.quiz-editor-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleQuizEditorSubmit = (questionData) => {
    const updatedQuestion = {
      questionId: isEditingQuestion && currentQuestionIndex !== null 
        ? quizData.questions[currentQuestionIndex].questionId 
        : `q${quizData.questions.length + 1}`,
      question: questionData.question,
      image: questionData.image || null,
      multipleAnswers: questionData.multipleAnswers || 'false',
      options: questionData.options
    };

    let updatedQuestions;
    
    if (isEditingQuestion && currentQuestionIndex !== null) {
      updatedQuestions = [...quizData.questions];
      updatedQuestions[currentQuestionIndex] = updatedQuestion;
    } else {
      updatedQuestions = [...quizData.questions, updatedQuestion];
    }

    setQuizData({
      ...quizData,
      questions: updatedQuestions
    });

    setCurrentQuestionIndex(null);
    setIsEditingQuestion(false);
  };

  const handleRemoveQuestion = (index) => {
    if (window.confirm('Are you sure you want to remove this question?')) {
      const updatedQuestions = quizData.questions.filter((_, i) => i !== index);
      
      updatedQuestions.forEach((q, idx) => {
        q.questionId = `q${idx + 1}`;
      });
      
      setQuizData({
        ...quizData,
        questions: updatedQuestions
      });

      if (currentQuestionIndex === index) {
        setCurrentQuestionIndex(null);
        setIsEditingQuestion(false);
      }
    }
  };

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
    
    updatedQuestions.forEach((q, idx) => {
      q.questionId = `q${idx + 1}`;
    });

    setQuizData({
      ...quizData,
      questions: updatedQuestions
    });

    if (currentQuestionIndex === index) {
      setCurrentQuestionIndex(newIndex);
    } else if (currentQuestionIndex === newIndex) {
      setCurrentQuestionIndex(index);
    }
  };

<<<<<<< HEAD
  // Updated saveQuiz function with proper POST/PUT logic
  const saveQuiz = async () => {
    // Validation
    if (!quizData.title) {
      alert('Please enter a quiz title');
      return;
    }
=======
const saveQuiz = async () => {
  if (!quizData.title) {
    alert('Please enter a quiz title');
    return;
  }
>>>>>>> b05018e57849741ed2c983d6e3a5305f58191b0a

  if (!selectedModule) {
    alert('Please select a module');
    return;
  }

  if (quizData.questions.length === 0) {
    alert('Please add at least one question');
    return;
  }

<<<<<<< HEAD
    try {
      setLoading(true);
      
      const moduleInfo = modules.find(m => m.code === selectedModule);
      
=======
  try {
    setLoading(true);
    const moduleInfo = modules.find(m => m.code === selectedModule);
    
    // Base data without quizId
    const baseQuizData = {
      title: quizData.title,
      course: selectedModule,
      time: quizData.time,
      questions: quizData.questions,
      createdAt: new Date().toISOString()
    };
    
    let response;
    
    if (mode === 'edit' && quizData.quizId) {
>>>>>>> b05018e57849741ed2c983d6e3a5305f58191b0a
      const finalQuizData = {
        ...baseQuizData,
        quizId: quizData.quizId,
<<<<<<< HEAD
        title: quizData.title,
        course: selectedModule,
        moduleTitle: moduleInfo?.title || '',
        time: quizData.time,
        createdAt: quizData.createdAt || new Date().toISOString(),
        questions: quizData.questions
      };
      
      console.log('Saving quiz:', finalQuizData);
      
      let response;
      
      // Check if we're editing an existing quiz or creating a new one
      if (mode === 'edit' && selectedQuiz) {
        // UPDATE existing quiz - using PUT request
        response = await request.PUT(`/cms/quizzes/${quizData.quizId}/`, finalQuizData);
        alert('Quiz updated successfully!');
      } else {
        // CREATE new quiz - using POST request
        response = await request.POST('/cms/quizzes/', finalQuizData);
        alert('Quiz created successfully!');
      }
      
      // Refresh the quizzes list
      await fetchExistingQuizzes();
      
      // Navigate back to quiz list or to courses page
      navigate('/cms/courses');
      
    } catch (err) {
      console.error('Failed to save quiz', err);
      
      // Handle different error status codes
      if (err.status === 401) {
        alert('Your session has expired. Please login again.');
      } else if (err.status === 400) {
        alert(`Validation error: ${err.data?.message || 'Please check your input'}`);
      } else {
        alert(`Failed to save quiz: ${err.message || 'Please try again'}`);
      }
    } finally {
      setLoading(false);
=======
      };
      console.log('Updating quiz:', finalQuizData);
      response = await request.PUT(`/cms/quizzes/${quizData.quizId}/`, finalQuizData);
      alert('Quiz updated successfully!');
    } else {
      console.log('Creating new quiz:', baseQuizData);
      response = await request.POST('/cms/quizzes/', baseQuizData);
      alert('Quiz created successfully!');
>>>>>>> b05018e57849741ed2c983d6e3a5305f58191b0a
    }
    
    navigate('/cms/courses');
  } catch (err) {
    console.error('Failed to save quiz', err);
    alert('Failed to save quiz: ' + (err.message || 'Please try again'));
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (mode === 'select') {
    return (
      <div className="quiz-creator-container">
        <div className="quiz-creator-header">
          <button className="back-btn" onClick={() => navigate('/cms/courses')}>
            ← Back
          </button>
          <h1>Quiz Manager</h1>
        </div>

        <div className="selection-panel">
          <button className="create-new-btn" onClick={handleCreateNew}>
            <span>+</span> Create New Quiz
          </button>

          <div className="existing-quizzes">
            <h2>Edit Existing Quiz</h2>
            {loading ? (
              <div>Loading...</div>
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
                        style={{ borderLeftColor: moduleColor }}
                      >
                        <div className="quiz-item-info">
                          <span className="quiz-item-title">{quiz.title}</span>
                          <span className="quiz-item-course" style={{ color: moduleColor }}>
                            {quiz.course} - {getModuleTitle(quiz.course)}
                          </span>
                          <span className="quiz-item-date">Created: {formatDate(quiz.createdAt)}</span>
                        </div>
                        <span className="quiz-item-time">{quiz.time}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        <div className="module-filter">
          <label>Filter:</label>
          <select 
            value={selectedModule} 
            onChange={(e) => setSelectedModule(e.target.value)}
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

  return (
    <div className="quiz-creator-container">
      <div className="quiz-creator-header">
        <button className="back-btn" onClick={() => setMode('select')}>
          ← Back
        </button>
        <h1>{mode === 'create' ? 'Create Quiz' : 'Edit Quiz'}</h1>
      </div>

      <div className="quiz-form">
        <div className="module-selection-section">
          <label>Module</label>
          <select 
            value={selectedModule}
            onChange={handleModuleChange}
          >
            <option value="">-- Select module --</option>
            {modules.map(module => (
              <option key={module.code} value={module.code}>
                {module.code} - {module.title}
              </option>
            ))}
          </select>
        </div>

        <div className="quiz-metadata">
          <div className="form-row">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={quizData.title}
                onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                placeholder="Quiz title"
              />
            </div>

            <div className="form-group">
              <label>Time</label>
              <select
                value={quizData.time}
                onChange={(e) => setQuizData({ ...quizData, time: e.target.value })}
              >
                <option value="5m">5 min</option>
                <option value="10m">10 min</option>
                <option value="15m">15 min</option>
                <option value="20m">20 min</option>
                <option value="30m">30 min</option>
                <option value="45m">45 min</option>
                <option value="60m">60 min</option>
              </select>
            </div>
          </div>
        </div>

        {quizData.questions.length > 0 && (
          <div className="questions-list-section">
            <div className="section-header">
              <h3>Questions ({quizData.questions.length})</h3>
              <button className="add-question-btn" onClick={handleAddQuestion}>
                + Add
              </button>
            </div>
            <div className="questions-list">
              {quizData.questions.map((q, index) => (
                <div key={index} className="question-item">
                  <div className="question-item-header">
                    <span className="question-number">Q{index + 1}.</span>
                    <div className="question-preview">
                      {q.question.replace(/<[^>]*>/g, '').substring(0, 80)}...
                    </div>
                    <div className="question-item-actions">
                      <button onClick={() => handleMoveQuestion(index, 'up')} disabled={index === 0}><MdArrowUpward  size={15}/></button>
                      <button onClick={() => handleMoveQuestion(index, 'down')} disabled={index === quizData.questions.length - 1}><MdArrowDownward size={15}/></button>
                      <button onClick={() => handleEditQuestion(index)}><MdEdit size={15}/></button>
                      <button onClick={() => handleRemoveQuestion(index)}><MdClose size={15} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="quiz-editor-section">
          <h2>{isEditingQuestion ? 'Edit Question' : 'New Question'}</h2>
          <QuizEditor 
            onSubmit={handleQuizEditorSubmit}
            initialData={isEditingQuestion && currentQuestionIndex !== null 
              ? {
                  question: quizData.questions[currentQuestionIndex].question || '',
                  options: quizData.questions[currentQuestionIndex].options || [],
                  multipleAnswers: quizData.questions[currentQuestionIndex].multipleAnswers || 'false'
                }
              : null
            }
          />
        </div>

        <div className="form-actions">
          <button className="cancel-btn" onClick={() => setMode('select')}>
            Cancel
          </button>
          <button className="save-btn" onClick={saveQuiz} disabled={loading}>
            {loading ? 'Saving...' : (mode === 'edit' ? 'Update Quiz' : 'Create Quiz')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateQuizPage;

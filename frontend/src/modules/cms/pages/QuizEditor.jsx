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
    id: null,
    title: '',
    course: '',
    moduleTitle: '',
    time: '15m',
    createdAt: new Date().toISOString(),
    questions: []
  });

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

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const data = await request.GET('/cms/courses/');
        setModules(data);
      } catch (err) {
        console.error('Failed to fetch modules', err);
      }
    };
    fetchModules();
  }, []);

  const fetchExistingQuizzes = async () => {
    try {
      setLoading(true);
      const data = await request.GET('/cms/quizzes/draft_quizzes/');
      setExistingQuizzes(data);
    } catch (err) {
      console.error('Failed to fetch quizzes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExistingQuizzes();
  }, []);

  useEffect(() => {
    if (quizId && mode === 'select') {
      loadQuizForEdit(quizId);
    }
  }, [quizId, mode]);

  const loadQuizForEdit = async (id) => {
    try {
      setLoading(true);
      const data = await request.GET(`/cms/quizzes/${id}/`);
      const moduleInfo = modules.find(m => m.code === data.course);
      
      const transformedQuestions = data.questions?.map(q => {
        let imageUrl = null;
        if (q.image) {
          if (typeof q.image === 'string' && !q.image.startsWith('http')) {
            imageUrl = `${request.getBaseUrl()}${q.image}`;
          } else {
            imageUrl = q.image;
          }
        }
        
        return {
          id: q.id || q.questionId,
          text: q.text,
          options: q.options.map(opt => ({
            text: opt.text,
            is_correct: opt.is_correct
          })),
          multipleAnswers: q.multipleAnswers || 'false',
          image: imageUrl,
          imageFile: null
        };
      }) || [];
      
      setQuizData({
        id: data.id,
        title: data.title,
        course: data.course,
        moduleTitle: moduleInfo?.title || '',
        time: data.time,
        createdAt: data.createdAt,
        questions: transformedQuestions
      });
      setSelectedModule(data.course);
      setSelectedQuiz(data);
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
      id: null,
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

  const handleCancelEdit = () => {
    setCurrentQuestionIndex(null);
    setIsEditingQuestion(false);
  };

  const handleQuizEditorSubmit = async (formData) => {
    const questionText = formData.get('question');
    const multipleAnswers = formData.get('multipleAnswers');
    const optionsJson = formData.get('options');
    const existingImageUrl = formData.get('existing_image_url');
    const questionId = formData.get('question_id');
    
    const parsedOptions = JSON.parse(optionsJson);
    
    const formattedOptions = parsedOptions.map(opt => ({
      text: opt.text,
      is_correct: opt.is_correct === "true" || opt.is_correct === true
    }));
    
    let imageValue = null;
    let imageFile = null;
    
    if (formData.has('image')) {
      imageFile = formData.get('image');
      imageValue = imageFile;
    } else if (existingImageUrl) {
      imageValue = existingImageUrl;
    }
    
    const updatedQuestion = {
      id: isEditingQuestion && currentQuestionIndex !== null 
        ? quizData.questions[currentQuestionIndex]?.id || null
        : null,
      text: questionText,
      options: formattedOptions,
      multipleAnswers: multipleAnswers,
      image: imageValue,
      imageFile: imageFile
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
      setQuizData({
        ...quizData,
        questions: updatedQuestions
      });
      if (currentQuestionIndex === index) {
        setCurrentQuestionIndex(null);
        setIsEditingQuestion(false);
      } else if (currentQuestionIndex !== null && currentQuestionIndex > index) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
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
      alert('Please add at least one question');
      return;
    }

    try {
      setLoading(true);
      
      const quizObject = {
        title: quizData.title,
        course: selectedModule,
        time: quizData.time,
        questions: []
      };
      
      if (mode === 'edit' && quizData.id) {
        quizObject.id = quizData.id;
      }
      
      if (mode === 'edit' && quizData.createdAt) {
        quizObject.createdAt = quizData.createdAt;
      } else if (mode === 'create') {
        quizObject.createdAt = new Date().toISOString();
      }
      
      const formData = new FormData();
      
      for (let i = 0; i < quizData.questions.length; i++) {
        const q = quizData.questions[i];
        
        const formattedOptions = q.options.map((opt, optIndex) => ({
          id: String.fromCharCode(65 + optIndex),
          text: opt.text,
          is_correct: opt.is_correct === true || opt.is_correct === "true"
        }));
        
        const questionObj = {
          text: q.text,
          multipleAnswers: q.multipleAnswers === "true" || q.multipleAnswers === true ? "true" : "false",
          options: formattedOptions
        };
        
        if (q.id && q.id !== null && q.id !== undefined) {
          questionObj.id = q.id;
        }
        
        if (q.image && q.image instanceof File) {
          questionObj.image = null;
          formData.append(`image_${i}`, q.image);
        } else if (q.image && typeof q.image === 'string' && q.image.startsWith('http')) {
          questionObj.image = q.image;
        }
        
        quizObject.questions.push(questionObj);
      }
      
      formData.append('quiz_data', JSON.stringify(quizObject));
      
      if (mode === 'edit' && quizData.id) {
        await request.PUT(`/cms/quizzes/${quizData.id}/`, formData, {
          isFormData: true
        });
        alert('Quiz updated successfully!');
      } else {
        await request.POST('/cms/quizzes/', formData, {
          isFormData: true
        });
        alert('Quiz created successfully!');
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
                        key={quiz.id} 
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
                      {q.text?.replace(/<[^>]*>/g, '').substring(0, 80) || 'No question text'}
                      {q.text?.length > 80 && '...'}
                    </div>
                    <div className="question-item-actions">
                      <button onClick={() => handleMoveQuestion(index, 'up')} disabled={index === 0}>
                        <MdArrowUpward size={15}/>
                      </button>
                      <button onClick={() => handleMoveQuestion(index, 'down')} disabled={index === quizData.questions.length - 1}>
                        <MdArrowDownward size={15}/>
                      </button>
                      <button onClick={() => handleEditQuestion(index)}>
                        <MdEdit size={15}/>
                      </button>
                      <button onClick={() => handleRemoveQuestion(index)}>
                        <MdClose size={15} />
                      </button>
                    </div>
                  </div>
                  {q.image && typeof q.image === 'string' && q.image.startsWith('http') && (
                    <div className="question-image-preview">
                      <img 
                        src={q.image} 
                        alt="Question" 
                        className="preview-thumbnail"
                      />
                    </div>
                  )}
                  {q.image && q.image instanceof File && (
                    <div className="question-image-preview">
                      <img 
                        src={URL.createObjectURL(q.image)} 
                        alt="Question" 
                        className="preview-thumbnail"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="quiz-editor-section">
          <div className="editor-header">
            <h2>{isEditingQuestion ? 'Edit Question' : 'New Question'}</h2>
            {isEditingQuestion && (
              <button className="cancel-edit-btn" onClick={handleCancelEdit}>
                Cancel Edit
              </button>
            )}
          </div>
          <QuizEditor 
            key={`${isEditingQuestion}-${currentQuestionIndex}`}
            onSubmit={handleQuizEditorSubmit}
            onCancel={handleCancelEdit}
            initialData={isEditingQuestion && currentQuestionIndex !== null 
              ? {
                  id: quizData.questions[currentQuestionIndex]?.id,
                  question: quizData.questions[currentQuestionIndex]?.text || '',
                  options: quizData.questions[currentQuestionIndex]?.options || [],
                  multipleAnswers: quizData.questions[currentQuestionIndex]?.multipleAnswers || 'false',
                  image: quizData.questions[currentQuestionIndex]?.image || null
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
            {loading ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateQuizPage;

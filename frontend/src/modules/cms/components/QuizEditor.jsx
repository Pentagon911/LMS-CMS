import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import { BlockMath } from "react-katex";
import "quill/dist/quill.snow.css";
import "katex/dist/katex.min.css";
import "./QuizEditor.css"; // We'll create this next

function QuizEditor() {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [latex, setLatex] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [quizTitle, setQuizTitle] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "Type your quiz question here...",
        modules: {
          toolbar: [
            ["bold", "italic", "underline", "strike"],
            [{ header: [1, 2, 3, false] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "blockquote", "code-block"],
            ["clean"]
          ]
        }
      });
    }
  }, []);

  const insertMath = (latexSymbol) => {
    const quill = quillRef.current;
    const range = quill.getSelection(true);
    quill.insertText(range.index, ` ${latexSymbol} `);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctAnswer === index) {
        setCorrectAnswer(null);
      } else if (correctAnswer > index) {
        setCorrectAnswer(correctAnswer - 1);
      }
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    const questionHTML = quillRef.current.root.innerHTML;
    
    if (!quizTitle.trim()) {
      alert("Please enter a quiz title");
      return;
    }
    
    if (!questionHTML.trim() || questionHTML === "<p><br></p>") {
      alert("Please enter a question");
      return;
    }
    
    if (correctAnswer === null) {
      alert("Please select the correct answer");
      return;
    }
    
    if (options.some(opt => !opt.trim())) {
      alert("Please fill in all options");
      return;
    }

    setIsSubmitting(true);
    
    const quizData = {
      title: quizTitle,
      question: questionHTML,
      equationPreview: latex,
      options: options,
      correctAnswer: correctAnswer,
      createdAt: new Date().toISOString()
    };

    console.log("Quiz Data:", quizData);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      // Show success message or redirect
    }, 1000);
  };

  const mathSymbols = [
    { symbol: "Σ", latex: "\\sum_{i=1}^{n}", label: "Sum" },
    { symbol: "∫", latex: "\\int_a^b", label: "Integral" },
    { symbol: "π", latex: "\\pi", label: "Pi" },
    { symbol: "√", latex: "\\sqrt{}", label: "Square Root" },
    { symbol: "∞", latex: "\\infty", label: "Infinity" },
    { symbol: "±", latex: "\\pm", label: "Plus-Minus" },
    { symbol: "α", latex: "\\alpha", label: "Alpha" },
    { symbol: "β", latex: "\\beta", label: "Beta" },
    { symbol: "θ", latex: "\\theta", label: "Theta" },
    { symbol: "λ", latex: "\\lambda", label: "Lambda" },
    { symbol: "μ", latex: "\\mu", label: "Mu" },
    { symbol: "σ", latex: "\\sigma", label: "Sigma" }
  ];

  return (
    <div className="quiz-editor-container">
      <div className="quiz-editor-header">
        <h1>Create New Quiz</h1>
        <p>Fill in the details below to create your interactive quiz question</p>
      </div>

      <div className="quiz-editor-content">
        {/* Title Section */}
        <div className="form-section">
          <label className="section-label">
            <span className="label-icon">📝</span>
            Quiz Title
          </label>
          <input
            type="text"
            className="title-input"
            placeholder="e.g., Mathematics Quiz - Chapter 1"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
          />
        </div>

        {/* Math Symbols Toolbar */}
        <div className="form-section">
          <label className="section-label">
            <span className="label-icon">🔢</span>
            Math Symbols
          </label>
          <div className="math-toolbar">
            {mathSymbols.map((item, index) => (
              <button
                key={index}
                className="math-symbol-btn"
                onClick={() => insertMath(item.latex)}
                title={item.label}
              >
                {item.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Question Editor */}
        <div className="form-section">
          <label className="section-label">
            <span className="label-icon">❓</span>
            Question
          </label>
          <div className="editor-wrapper">
            <div
              ref={editorRef}
              className="quill-editor"
            />
          </div>
        </div>

        {/* Equation Preview */}
        <div className="form-section">
          <label className="section-label">
            <span className="label-icon">📐</span>
            Equation Preview
          </label>
          <div className="equation-container">
            <input
              type="text"
              className="equation-input"
              placeholder="Enter LaTeX equation (e.g., \int_0^1 x^2 dx)"
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
            />
            {latex && (
              <div className="equation-preview" onClick={() => setShowPreview(!showPreview)}>
                <BlockMath math={latex} />
              </div>
            )}
          </div>
        </div>

        {/* Answer Options */}
        <div className="form-section">
          <div className="options-header">
            <label className="section-label">
              <span className="label-icon">✓</span>
              Answer Options
            </label>
            <button className="add-option-btn" onClick={addOption}>
              <span className="btn-icon">+</span>
              Add Option
            </button>
          </div>
          
          <div className="options-container">
            {options.map((opt, index) => (
              <div key={index} className="option-item">
                <div className="option-number">{index + 1}</div>
                <input
                  type="text"
                  className={`option-input ${correctAnswer === index ? 'correct-option' : ''}`}
                  placeholder={`Option ${index + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
                <button
                  className={`correct-btn ${correctAnswer === index ? 'selected' : ''}`}
                  onClick={() => setCorrectAnswer(index)}
                  title="Mark as correct answer"
                >
                  ✓
                </button>
                {options.length > 2 && (
                  <button
                    className="remove-option-btn"
                    onClick={() => removeOption(index)}
                    title="Remove option"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {correctAnswer !== null && (
            <div className="correct-answer-indicator">
              ✓ Correct answer: Option {correctAnswer + 1}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            className="preview-btn"
            onClick={() => setShowPreview(!showPreview)}
          >
            <span className="btn-icon">👁️</span>
            Preview
          </button>
          <button
            className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Saving...
              </>
            ) : (
              <>
                <span className="btn-icon">💾</span>
                Save Quiz
              </>
            )}
          </button>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="preview-modal">
            <div className="preview-content">
              <div className="preview-header">
                <h3>Quiz Preview</h3>
                <button className="close-preview" onClick={() => setShowPreview(false)}>×</button>
              </div>
              <div className="preview-body">
                <h4>{quizTitle || "Untitled Quiz"}</h4>
                <div className="preview-question" dangerouslySetInnerHTML={{ 
                  __html: quillRef.current?.root.innerHTML || "No question entered" 
                }} />
                {latex && (
                  <div className="preview-equation">
                    <BlockMath math={latex} />
                  </div>
                )}
                <div className="preview-options">
                  {options.map((opt, idx) => (
                    <div key={idx} className={`preview-option ${correctAnswer === idx ? 'preview-correct' : ''}`}>
                      <span className="preview-option-number">{idx + 1}.</span>
                      <span>{opt || `Option ${idx + 1}`}</span>
                      {correctAnswer === idx && <span className="correct-badge">✓ Correct</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizEditor;

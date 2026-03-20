import { useState, useEffect } from "react";
import TextEditor from "./TextEditor";
import { 
  MdClose, MdAdd, MdRemove, MdPreview, 
  MdCheckCircle, MdRadioButtonChecked,
  MdCheckBox, MdCheckBoxOutlineBlank, 
  MdQuiz, MdImage, MdDelete
} from 'react-icons/md';
import "./QuizEditor.css";

function QuizEditor({ onSubmit, initialData = null }) {
  const [question, setQuestion] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [options, setOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false }
  ]);
  const [multipleAnswers, setMultipleAnswers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (initialData) {
      setQuestion(initialData.question || "");
      setImage(initialData.image || null);
      
      if (initialData.options) {
        const formattedOptions = initialData.options.map(opt => ({
          text: opt.text || opt,
          isCorrect: opt.is_correct === "true" || opt.is_correct === true
        }));
        setOptions(formattedOptions);
      }
      
      setMultipleAnswers(initialData.multipleAnswers === "true");
    } else {
      setOptions([
        { text: "", isCorrect: false },
        { text: "", isCorrect: false }
      ]);
      setQuestion("");
      setImage(null);
      setImagePreview("");
      setMultipleAnswers(false);
    }
  }, [initialData]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview("");
  };

  const addOption = () => setOptions([...options, { text: "", isCorrect: false }]);

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index].text = value;
    setOptions(newOptions);
  };

  const toggleCorrectAnswer = (index) => {
    const newOptions = [...options];
    
    if (multipleAnswers) {
      newOptions[index].isCorrect = !newOptions[index].isCorrect;
    } else {
      newOptions.forEach((opt, i) => opt.isCorrect = i === index);
    }
    
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    if (!question.trim() || question === "<p><br></p>") {
      alert("Please enter a question");
      return;
    }
    
    const hasCorrectAnswer = options.some(opt => opt.isCorrect);
    if (!hasCorrectAnswer) {
      alert("Please select at least one correct answer");
      return;
    }
    
    if (options.some(opt => !opt.text.trim())) {
      alert("Please fill in all options");
      return;
    }

    setIsSubmitting(true);
    
    const formattedOptions = options.map((opt, idx) => ({
      id: String.fromCharCode(65 + idx),
      text: opt.text,
      is_correct: opt.isCorrect ? "true" : "false"
    }));

    const questionData = {
      questionId: `q${Date.now()}`,
      question: question,
      image: imagePreview || null,
      multipleAnswers: multipleAnswers ? "true" : "false",
      options: formattedOptions
    };

    onSubmit(questionData);

    setTimeout(() => {
      setOptions([
        { text: "", isCorrect: false },
        { text: "", isCorrect: false }
      ]);
      setQuestion("");
      setImage(null);
      setImagePreview("");
      setMultipleAnswers(false);
      setIsSubmitting(false);
      alert(initialData ? "Question updated!" : "Question added!");
    }, 500);
  };

  return (
    <div className="quiz-editor-container">
      <div className="quiz-editor-content">
        {/* Question */}
        <div className="form-group">
          <label><MdQuiz /> Question</label>
          <TextEditor
            value={question}
            onChange={setQuestion}
            placeholder="Type your question here..."
            height="200px"
          />
        </div>

        {/* Image */}
        <div className="form-group">
          <label><MdImage /> Image (Optional)</label>
          {!imagePreview ? (
            <div className="upload-area">
              <input type="file" id="image" accept="image/*" onChange={handleImageUpload} hidden />
              <label htmlFor="image" className="upload-label">Click to upload image</label>
            </div>
          ) : (
            <div className="preview-area">
              <img src={imagePreview} alt="Preview" />
              <button onClick={removeImage}><MdDelete /> Remove</button>
            </div>
          )}
        </div>

        {/* Answer Type */}
        <div className="form-group">
          <label><MdCheckCircle /> Answer Type</label>
          <div className="toggle-group">
            <button className={`toggle-btn ${!multipleAnswers ? 'active' : ''}`} onClick={() => setMultipleAnswers(false)}>
              <MdRadioButtonChecked /> Single
            </button>
            <button className={`toggle-btn ${multipleAnswers ? 'active' : ''}`} onClick={() => setMultipleAnswers(true)}>
              <MdCheckBox /> Multiple
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="form-group">
          <div className="options-header">
            <label>✓ Answer Options</label>
            <button onClick={addOption}><MdAdd /> Add</button>
          </div>
          
          {options.map((opt, i) => (
            <div key={i} className="option-row">
              <span className="option-num">{i+1}</span>
              <input
                type="text"
                value={opt.text}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                placeholder={`Option ${i+1}`}
                className={opt.isCorrect ? 'correct' : ''}
              />
              <button className={`correct-btn ${opt.isCorrect ? 'selected' : ''}`} onClick={() => toggleCorrectAnswer(i)}>
                {multipleAnswers ? (opt.isCorrect ? <MdCheckBox /> : <MdCheckBoxOutlineBlank />) : <MdCheckCircle />}
              </button>
              {options.length > 2 && <button onClick={() => removeOption(i)}><MdRemove /></button>}
            </div>
          ))}

          {options.some(o => o.isCorrect) && (
            <div className="correct-indicator">
              <MdCheckCircle /> Correct: Option {options.findIndex(o => o.isCorrect) + 1}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="action-buttons">
          <button onClick={handleSubmit} disabled={isSubmitting} className="submit">
            {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Add')}
          </button>
        </div>

      </div>
    </div>
  );
}

export default QuizEditor;

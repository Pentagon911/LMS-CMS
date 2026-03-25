import { useState, useEffect } from "react";
import TextEditor from "./TextEditor";
import { 
  MdClose, MdAdd, MdRemove, MdPreview, 
  MdCheckCircle, MdRadioButtonChecked,
  MdCheckBox, MdCheckBoxOutlineBlank, 
  MdQuiz, MdImage, MdDelete
} from 'react-icons/md';
import "./QuizEditor.css";

function QuizEditor({ onSubmit, initialData = null, onCancel = null }) {
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

  // Effect to load initial data for editing
  useEffect(() => {
    if (initialData) {
      console.log("Loading question for edit:", initialData);
      
      setQuestion(initialData.question || "");
      
      // Handle image
      if (initialData.image) {
        setImagePreview(initialData.image);
        setImage(null);
      } else {
        setImage(null);
        setImagePreview("");
      }
      
      // Handle options
      if (initialData.options && initialData.options.length > 0) {
        const formattedOptions = initialData.options.map(opt => ({
          text: opt.text || opt,
          isCorrect: opt.is_correct === "true" || opt.is_correct === true || opt.isCorrect === true
        }));
        setOptions(formattedOptions);
      } else {
        setOptions([
          { text: "", isCorrect: false },
          { text: "", isCorrect: false }
        ]);
      }
      
      // Handle multiple answers
      setMultipleAnswers(initialData.multipleAnswers === "true" || initialData.multipleAnswers === true);
    } else {
      // Reset form for new question
      console.log("Resetting form for new question");
      resetForm();
    }
  }, [initialData]); // This dependency is crucial for updates

  const resetForm = () => {
    setOptions([
      { text: "", isCorrect: false },
      { text: "", isCorrect: false }
    ]);
    setQuestion("");
    setImage(null);
    setImagePreview("");
    setMultipleAnswers(false);
  };

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

  const addOption = () => {
    setOptions([...options, { text: "", isCorrect: false }]);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      // If removing a correct answer, ensure there's still a correct answer
      if (options[index].isCorrect && !newOptions.some(opt => opt.isCorrect)) {
        newOptions[0].isCorrect = true;
      }
      setOptions(newOptions);
    } else {
      alert("Minimum 2 options required");
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
      // Toggle the selected option
      newOptions[index].isCorrect = !newOptions[index].isCorrect;
    } else {
      // Single answer - set only this one as correct
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === index;
      });
    }
    
    setOptions(newOptions);
  };

  const validateForm = () => {
    // Check question
    if (!question.trim() || question === "<p><br></p>" || question === "<p></p>") {
      alert("Please enter a question");
      return false;
    }
    
    // Check options
    if (options.length < 2) {
      alert("Please add at least 2 options");
      return false;
    }
    
    // Check if all options have text
    const emptyOptions = options.some(opt => !opt.text.trim());
    if (emptyOptions) {
      alert("Please fill in all options");
      return false;
    }
    
    // Check for correct answer
    const hasCorrectAnswer = options.some(opt => opt.isCorrect);
    if (!hasCorrectAnswer) {
      alert("Please select at least one correct answer");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Format options for API
      const formattedOptions = options.map((opt, idx) => ({
        id: String.fromCharCode(65 + idx),
        text: opt.text,
        is_correct: opt.isCorrect ? "true" : "false"
      }));

      const questionData = {
        question: question,
        image: imagePreview || null,
        multipleAnswers: multipleAnswers ? "true" : "false",
        options: formattedOptions
      };

      // Call the onSubmit callback
      await onSubmit(questionData);
      
      // Reset form only if it's a new question (not editing)
      if (!initialData) {
        resetForm();
      }
      
      // Show success message
      const message = initialData ? "Question updated successfully!" : "Question added successfully!";
      alert(message);
      
    } catch (error) {
      console.error("Error submitting question:", error);
      alert("Failed to save question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    resetForm();
  };

  // Get correct answer indicator text
  const getCorrectAnswersText = () => {
    const correctIndices = options.reduce((indices, opt, idx) => {
      if (opt.isCorrect) indices.push(idx + 1);
      return indices;
    }, []);
    
    if (correctIndices.length === 0) return "";
    if (correctIndices.length === 1) {
      return `Correct: Option ${correctIndices[0]}`;
    }
    return `Correct: Options ${correctIndices.join(", ")}`;
  };

  return (
    <div className="quiz-editor-container">
      <div className="quiz-editor-content">
        {/* Header with title */}
        <div className="editor-header">
          <h3>{initialData ? "Edit Question" : "Add New Question"}</h3>
          {initialData && onCancel && (
            <button className="cancel-edit-btn" onClick={handleCancel}>
              Cancel Edit
            </button>
          )}
        </div>

        {/* Question */}
        <div className="form-group">
          <label><MdQuiz /> Question *</label>
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
              <input 
                type="file" 
                id="image" 
                accept="image/*" 
                onChange={handleImageUpload} 
                hidden 
              />
              <label htmlFor="image" className="upload-label">
                Click to upload image
              </label>
            </div>
          ) : (
            <div className="preview-area">
              <img src={imagePreview} alt="Preview" />
              <button onClick={removeImage} className="remove-image-btn">
                <MdDelete /> Remove
              </button>
            </div>
          )}
        </div>

        {/* Answer Type */}
        <div className="form-group">
          <label><MdCheckCircle /> Answer Type *</label>
          <div className="toggle-group">
            <button 
              type="button"
              className={`toggle-btn ${!multipleAnswers ? 'active' : ''}`} 
              onClick={() => setMultipleAnswers(false)}
            >
              <MdRadioButtonChecked /> Single Answer
            </button>
            <button 
              type="button"
              className={`toggle-btn ${multipleAnswers ? 'active' : ''}`} 
              onClick={() => setMultipleAnswers(true)}
            >
              <MdCheckBox /> Multiple Answers
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="form-group">
          <div className="options-header">
            <label>✓ Answer Options *</label>
            <button type="button" onClick={addOption} className="add-option-btn">
              <MdAdd /> Add Option
            </button>
          </div>
          
          {options.map((opt, i) => (
            <div key={i} className="option-row">
              <span className="option-num">{String.fromCharCode(65 + i)}</span>
              <input
                type="text"
                value={opt.text}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                className={opt.isCorrect ? 'correct-option' : ''}
              />
              <button 
                type="button"
                className={`correct-btn ${opt.isCorrect ? 'selected' : ''}`} 
                onClick={() => toggleCorrectAnswer(i)}
                title={opt.isCorrect ? "Mark as incorrect" : "Mark as correct"}
              >
                {multipleAnswers ? (
                  opt.isCorrect ? <MdCheckBox /> : <MdCheckBoxOutlineBlank />
                ) : (
                  opt.isCorrect ? <MdCheckCircle /> : <MdRadioButtonChecked />
                )}
              </button>
              {options.length > 2 && (
                <button 
                  type="button"
                  onClick={() => removeOption(i)} 
                  className="remove-option-btn"
                  title="Remove option"
                >
                  <MdRemove />
                </button>
              )}
            </div>
          ))}

          {options.some(o => o.isCorrect) && (
            <div className="correct-indicator">
              <MdCheckCircle /> {getCorrectAnswersText()}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="action-buttons">
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="submit-btn"
          >
            {isSubmitting ? 'Saving...' : (initialData ? 'Update Question' : 'Add Question')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizEditor;

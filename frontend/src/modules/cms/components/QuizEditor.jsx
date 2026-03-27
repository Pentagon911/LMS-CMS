import { useState, useEffect } from "react";
import TextEditor from "./TextEditor";
import { 
  MdClose, MdAdd, MdRemove, MdPreview, 
  MdCheckCircle, MdRadioButtonChecked,
  MdCheckBox, MdCheckBoxOutlineBlank, 
  MdQuiz, MdImage, MdDelete, MdUpload
} from 'react-icons/md';
import "./QuizEditor.css";

function QuizEditor({ onSubmit, initialData = null, onCancel = null }) {
  const [question, setQuestion] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [options, setOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false }
  ]);
  const [multipleAnswers, setMultipleAnswers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExistingImage, setIsExistingImage] = useState(false);

  useEffect(() => {
    if (initialData) {
      setQuestion(initialData.question || "");
      
      if (initialData.image && initialData.image !== null && initialData.image !== "") {
        if (initialData.image instanceof File) {
          const previewUrl = URL.createObjectURL(initialData.image);
          setImagePreview(previewUrl);
          setImage(initialData.image);
          setIsExistingImage(false);
        } else if (typeof initialData.image === 'string') {
          if (initialData.image.startsWith('blob:')) {
            setImagePreview(initialData.image);
            setImage(null);
            setIsExistingImage(false);
          } else if (initialData.image.startsWith('data:image')) {
            setImagePreview(initialData.image);
            setImage(null);
            setIsExistingImage(false);
          } else {
            setImagePreview(initialData.image);
            setImage(null);
            setIsExistingImage(true);
          }
        }
      } else {
        setImage(null);
        setImagePreview("");
        setIsExistingImage(false);
      }
      
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
      
      setMultipleAnswers(initialData.multipleAnswers === "true" || initialData.multipleAnswers === true);
    } else {
      resetForm();
    }
    
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [initialData]);

  const resetForm = () => {
    setOptions([
      { text: "", isCorrect: false },
      { text: "", isCorrect: false }
    ]);
    setQuestion("");
    setImage(null);
    setImagePreview("");
    setUploadError("");
    setMultipleAnswers(false);
    setIsExistingImage(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      return;
    }
    
    setUploadError("");
    
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setImage(file);
    setIsExistingImage(false);
  };

  const removeImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImage(null);
    setImagePreview("");
    setUploadError("");
    setIsExistingImage(false);
  };

  const addOption = () => {
    setOptions([...options, { text: "", isCorrect: false }]);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
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
      newOptions[index].isCorrect = !newOptions[index].isCorrect;
    } else {
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === index;
      });
    }
    
    setOptions(newOptions);
  };

  const validateForm = () => {
    if (!question.trim() || question === "<p><br></p>" || question === "<p></p>") {
      alert("Please enter a question");
      return false;
    }
    
    if (options.length < 2) {
      alert("Please add at least 2 options");
      return false;
    }
    
    const emptyOptions = options.some(opt => !opt.text.trim());
    if (emptyOptions) {
      alert("Please fill in all options");
      return false;
    }
    
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
      const formData = new FormData();
      
      const cleanedQuestion = question.trim() === "<p><br></p>" || question === "<p></p>" ? "" : question;
      formData.append('question', cleanedQuestion);
      formData.append('multipleAnswers', multipleAnswers ? "true" : "false");
      
      if (image) {
        formData.append('image', image);
      } else if (imagePreview && isExistingImage) {
        formData.append('existing_image_url', imagePreview);
      }
      
      const formattedOptions = options.map((opt, idx) => ({
        id: String.fromCharCode(65 + idx),
        text: opt.text,
        is_correct: opt.isCorrect ? "true" : "false"
      }));
      
      formData.append('options', JSON.stringify(formattedOptions));
      
      if (initialData && initialData.id) {
        formData.append('question_id', initialData.id);
      }
      
      await onSubmit(formData);
      
      if (!initialData) {
        resetForm();
      }
      
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
        <div className="editor-header">
          <h3>{initialData ? "Edit Question" : "Add New Question"}</h3>
          {initialData && onCancel && (
            <button className="cancel-edit-btn" onClick={handleCancel}>
              Cancel Edit
            </button>
          )}
        </div>

        <div className="form-group">
          <label><MdQuiz /> Question *</label>
          <TextEditor
            value={question}
            onChange={setQuestion}
            placeholder="Type your question here..."
            height="200px"
          />
        </div>

        <div className="form-group">
          <label><MdImage /> Image (Optional)</label>
          {!imagePreview ? (
            <div className="upload-area">
              <input 
                type="file" 
                id="question-image" 
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" 
                onChange={handleImageUpload}
                hidden 
              />
              <label htmlFor="question-image" className="upload-label">
                <MdUpload /> Click to upload image
              </label>
              <p className="upload-hint">Supported: JPEG, PNG, GIF, WEBP (Max 5MB)</p>
              {uploadError && <p className="upload-error">{uploadError}</p>}
            </div>
          ) : (
            <div className="preview-area">
              <img src={imagePreview} alt="Question preview" />
              <div className="preview-actions">
                <button 
                  onClick={removeImage} 
                  className="remove-image-btn"
                >
                  <MdDelete /> Remove
                </button>
              </div>
            </div>
          )}
        </div>

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

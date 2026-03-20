import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "./TextEditor.css";

const TextEditor = ({ 
  value = "", 
  onChange, 
  placeholder = "Write your content here...",
  height = "300px",
  readOnly = false 
}) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: placeholder,
        readOnly: readOnly,
        modules: {
          toolbar: readOnly ? false : [
            ["bold", "italic", "underline", "strike"],
            [{ header: [1, 2, 3, false] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "blockquote", "code-block"],
            ["clean"]
          ]
        }
      });

      // Set initial content
      if (value) {
        quillRef.current.root.innerHTML = value;
      }

      // Listen for text changes
      quillRef.current.on('text-change', () => {
        if (onChange) {
          onChange(quillRef.current.root.innerHTML);
        }
      });
    }
  }, [placeholder, readOnly, onChange]);

  // Update content if value changes externally
  useEffect(() => {
    if (quillRef.current && quillRef.current.root.innerHTML !== value) {
      quillRef.current.root.innerHTML = value;
    }
  }, [value]);

  return (
    <div className="text-editor" style={{ height }}>
      <div ref={editorRef} className="quill-editor" />
    </div>
  );
};

export default TextEditor;

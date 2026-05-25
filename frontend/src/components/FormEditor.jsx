import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Mic, MicOff, Send, Download, Loader2, Edit3, Globe, AlertTriangle } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// קביעת כתובת השרת מתוך משתני הסביבה או ברירת מחדל לוקאלית
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const FormEditor = ({ file, apiKey, onBack, initialFields = null, initialBoxes = [] }) => {
  const [step, setStep] = useState(initialFields ? 2 : 1);
  const [language, setLanguage] = useState("English");

  const [fields, setFields] = useState(initialFields || []);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [rawInput, setRawInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedData, setSynthesizedData] = useState({});

  const [activeField, setActiveField] = useState(null);
  const [directInput, setDirectInput] = useState({});

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [boxes, setBoxes] = useState(initialBoxes || []);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBox, setCurrentBox] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");

  const containerRef = useRef(null);
  const [pdfScale, setPdfScale] = useState(1.0);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        if (activeField) {
          setDirectInput(prev => ({ ...prev, [activeField.fieldName]: transcript }));
        } else {
          setRawInput(transcript);
        }
      };
    }
  }, [activeField]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'Hebrew' ? 'he-IL' : 'en-US';
    }
  }, [language]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const handleAnalyzeForm = async () => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);

      // שימוש במשתנה הכתובת הדינמי
      const response = await fetch(`${apiUrl}/api/analyze-form`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: formData
      });

      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();

      let parsedFields = data.fields;
      if (typeof parsedFields === 'string') {
        const match = parsedFields.match(/\[.*\]/s);
        if (match) parsedFields = JSON.parse(match[0]);
      }

      setFields(parsedFields);
      setStep(2);
    } catch (error) {
      alert("Error analyzing form: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSynthesize = async () => {
    setIsSynthesizing(true);
    try {
      const formData = new FormData();
      formData.append('raw_input', rawInput);
      formData.append('fields', JSON.stringify(fields));
      formData.append('direct_inputs', JSON.stringify(directInput));

      // שימוש במשתנה הכתובת הדינמי
      const response = await fetch(`${apiUrl}/api/synthesize`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: formData
      });

      if (!response.ok) throw new Error('Synthesis failed');
      const data = await response.json();

      setSynthesizedData(data.mapped_data);
      setStep(3);
    } catch (error) {
      alert("Error synthesizing: " + error.message);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleMouseDown = (e) => {
    if (!selectedField) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setCurrentBox({ startX: x, startY: y, endX: x, endY: y, field: selectedField });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCurrentBox(prev => ({
      ...prev,
      endX: e.clientX - rect.left,
      endY: e.clientY - rect.top
    }));
  };

  const handleMouseUp = () => {
    if (isDrawing && currentBox) {
      const newBox = {
        x0: Math.min(currentBox.startX, currentBox.endX) / pdfScale,
        y0: Math.min(currentBox.startY, currentBox.endY) / pdfScale,
        x1: Math.max(currentBox.startX, currentBox.endX) / pdfScale,
        y1: Math.max(currentBox.startY, currentBox.endY) / pdfScale,
        field: currentBox.field,
        page: pageNumber - 1
      };
      setBoxes([...boxes, newBox]);
      setSelectedField(null);
    }
    setIsDrawing(false);
    setCurrentBox(null);
  };

  const handleRemoveBox = (fieldName, e) => {
    e.stopPropagation();
    setBoxes(boxes.filter(b => b.field.name !== fieldName));
    if (selectedField?.name === fieldName) setSelectedField(null);
  };

  const handleGeneratePdf = async () => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const textMappings = boxes.map(b => ({
        text: synthesizedData[b.field.name] || "",
        page: b.page,
        rect: { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 }
      }));

      formData.append('mappings', JSON.stringify(textMappings));

      // שימוש במשתנה הכתובת הדינמי
      const response = await fetch(`${apiUrl}/api/generate-pdf`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filled_${file.name}`;
      a.click();
    } catch (error) {
      alert("Error generating PDF: " + error.message);
    }
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
  });

  const handleSaveTemplate = async () => {
      try {
          const base64 = await fileToBase64(file);
          const template = {
              id: Date.now(),
              filename: file.name,
              pdfBase64: base64,
              fields: fields,
              boxes: boxes
          };
          const existing = JSON.parse(localStorage.getItem('form_templates') || '[]');
          
          const newStorageString = JSON.stringify([...existing.filter(t => t.filename !== file.name), template]);
          if (newStorageString.length > 4.5 * 1024 * 1024) {
              alert("Warning: Local storage is nearly full. You may need to delete old templates soon.");
          }
          
          localStorage.setItem('form_templates', newStorageString);
          alert("Template saved successfully! You can reuse this form from the dashboard.");
      } catch (e) {
          alert("Failed to save template. It might be too large for local storage.");
      }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in" dir="auto">
      <div className="flex items-center justify-between">
        <h2 dir="auto">{file.name}</h2>
        <button onClick={onBack} className="glass-button" style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}>Back</button>
      </div>

      {step === 1 && (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>Step 1: AI Analysis</h3>
          <p className="text-secondary mt-2 mb-6">Select your preferred language and extract fields from this document.</p>

          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error-color)', padding: '16px', borderRadius: '8px', maxWidth: '600px', margin: '0 auto 24px auto', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
            <AlertTriangle color="var(--error-color)" size={24} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>
              <strong>Note:</strong> Tables, checkbox grids, and matrices must be filled manually outside of this app. The AI will completely ignore them to reduce processing costs and focus strictly on free-text blocks.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <Globe size={20} className="text-secondary" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="glass-input"
              style={{ padding: '8px 16px', cursor: 'pointer' }}
            >
              <option value="English">English</option>
              <option value="Hebrew">עברית (Hebrew)</option>
            </select>
          </div>

          <button onClick={handleAnalyzeForm} disabled={isAnalyzing} className="glass-button mx-auto w-full" style={{ maxWidth: '300px' }}>
            {isAnalyzing ? <><Loader2 className="animate-spin" /> Analyzing...</> : "Analyze Document"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex gap-6">
          <div className="glass-panel w-full" style={{ padding: '32px', flex: 1, display: 'flex', flexDirection: 'column' }}>

            {!activeField ? (
              <>
                <h3>Step 2: Global Unstructured Input</h3>
                <p className="text-secondary mb-4" style={{ fontSize: '0.9rem' }}>Record or type your thoughts generally. The AI will map it to all fields automatically.</p>

                <div className="relative mb-6 flex-grow">
                  <textarea
                    dir="auto"
                    className="glass-input w-full h-full"
                    style={{ minHeight: '300px', resize: 'vertical' }}
                    placeholder="Start typing or click the mic to speak..."
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                  />
                  <button
                    onClick={toggleListen}
                    style={{
                      position: 'absolute', bottom: '16px', right: '16px',
                      background: isListening ? 'var(--error-color)' : 'var(--accent-color)',
                      color: 'white', border: 'none', padding: '12px', borderRadius: '50%',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s', boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.5)' : 'none'
                    }}
                  >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 dir="auto">Direct Input: {activeField.fieldName}</h3>
                  <button onClick={() => setActiveField(null)} className="glass-button" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Back to Global Input</button>
                </div>
                <p className="text-secondary mb-4" style={{ fontSize: '0.9rem' }}>Type specifically for this field. The AI will still refine it into high official language.</p>

                <div className="relative mb-6 flex-grow">
                  <textarea
                    dir="auto"
                    className="glass-input w-full h-full"
                    style={{ minHeight: '300px', resize: 'vertical' }}
                    placeholder={`Start typing your answer for ${activeField.fieldName}...`}
                    value={directInput[activeField.fieldName] || ''}
                    onChange={(e) => setDirectInput(prev => ({ ...prev, [activeField.fieldName]: e.target.value }))}
                  />
                  <button
                    onClick={toggleListen}
                    style={{
                      position: 'absolute', bottom: '16px', right: '16px',
                      background: isListening ? 'var(--error-color)' : 'var(--accent-color)',
                      color: 'white', border: 'none', padding: '12px', borderRadius: '50%',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s', boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.5)' : 'none'
                    }}
                  >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                </div>
              </div>
            )}

            <button onClick={handleSynthesize} disabled={isSynthesizing || (!rawInput.trim() && Object.keys(directInput).length === 0)} className="glass-button w-full mt-4">
              {isSynthesizing ? <><Loader2 className="animate-spin" /> Synthesizing...</> : <><Send size={18} /> Synthesize & Map</>}
            </button>
          </div>

          <div className="glass-panel" style={{ width: '350px', padding: '32px', maxHeight: '600px', overflowY: 'auto' }}>
            <h3 className="mb-4">Detected Fields</h3>
            <div className="flex flex-col gap-3">
              {fields.map((f, i) => {
                const isActive = activeField?.fieldName === f.fieldName;
                return (
                  <div
                    key={i}
                    onClick={() => setActiveField(f)}
                    style={{
                      padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px',
                      cursor: 'pointer',
                      border: isActive ? '1px solid var(--accent-color)' : '1px solid transparent',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)' }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    dir="auto"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-2" style={{ fontWeight: 600 }}>
                        <Edit3 size={14} />
                        {f.fieldName}
                      </span>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: f.category === 'Mandatory' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)' }}>
                        {f.category}
                      </span>
                    </div>
                    <p className="text-secondary" style={{ fontSize: '0.85rem' }}>{f.context || "Click to add direct input"}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex gap-6">
          <div className="glass-panel flex flex-col" style={{ flex: 1, padding: '20px', alignItems: 'center' }}>
            <h3 className="mb-4">Step 3: Map to Document</h3>
            <p className="text-secondary mb-4 text-center">Select a field on the right, then draw a box on the PDF where it should go.</p>

            <div
              ref={containerRef}
              style={{ position: 'relative', display: 'inline-block', border: '1px solid var(--glass-border)', cursor: selectedField ? 'crosshair' : 'default' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <Document file={file} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                <Page pageNumber={pageNumber} scale={pdfScale} renderTextLayer={false} renderAnnotationLayer={false} />
              </Document>

              {boxes.filter(b => b.page === pageNumber - 1).map((b, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: b.x0 * pdfScale, top: b.y0 * pdfScale,
                  width: (b.x1 - b.x0) * pdfScale, height: (b.y1 - b.y0) * pdfScale,
                  border: '2px solid #22c55e', backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ background: '#22c55e', color: 'white', padding: '2px 6px', fontSize: '10px', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                    {b.field.name}
                  </span>
                </div>
              ))}

              {isDrawing && currentBox && (
                <div style={{
                  position: 'absolute',
                  left: Math.min(currentBox.startX, currentBox.endX), top: Math.min(currentBox.startY, currentBox.endY),
                  width: Math.abs(currentBox.startX - currentBox.endX), height: Math.abs(currentBox.startY - currentBox.endY),
                  border: '2px dashed var(--accent-color)', backgroundColor: 'rgba(59, 130, 246, 0.2)', pointerEvents: 'none'
                }} />
              )}
            </div>

            <div className="flex gap-4 mt-4 items-center">
              <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)} className="glass-button py-2">Prev</button>
              <span>Page {pageNumber} of {numPages}</span>
              <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => p + 1)} className="glass-button py-2">Next</button>
            </div>
          </div>

          <div className="glass-panel" style={{ width: '350px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h3 className="mb-4">Synthesized Answers</h3>
            <div className="flex flex-col gap-3 flex-grow" style={{ overflowY: 'auto', maxHeight: '500px' }}>

              {Object.entries(synthesizedData).map(([fieldName, text]) => {
                const isMapped = boxes.some(b => b.field.name === fieldName);
                const isSelected = selectedField?.name === fieldName;
                const isEditing = editingField === fieldName;

                return (
                  <div
                    key={`text-${fieldName}`}
                    onClick={() => !isMapped && !isEditing && setSelectedField({ type: 'text', name: fieldName })}
                    style={{
                      padding: '12px', borderRadius: '8px', cursor: (isMapped || isEditing) ? 'default' : 'pointer',
                      background: isMapped ? 'rgba(34, 197, 94, 0.1)' : (isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)'),
                      border: `1px solid ${isSelected ? 'var(--accent-color)' : (isMapped ? '#22c55e' : 'transparent')}`
                    }}
                    dir="auto"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{fieldName}</div>
                      <div className="flex gap-2">
                        {isMapped && (
                          <button onClick={(e) => handleRemoveBox(fieldName, e)} className="glass-button" style={{ padding: '2px 6px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.2)' }}>Unmap (X)</button>
                        )}
                        {!isMapped && !isEditing && (
                          <button onClick={(e) => { e.stopPropagation(); setEditingField(fieldName); setEditValue(text); }} className="glass-button" style={{ padding: '2px 6px', fontSize: '0.75rem' }}>Edit</button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                        <textarea
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="glass-input w-full"
                          style={{ minHeight: '80px', fontSize: '0.85rem' }}
                          dir="auto"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingField(null)} className="glass-button" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Cancel</button>
                          <button onClick={() => {
                            setSynthesizedData(prev => ({ ...prev, [fieldName]: editValue }));
                            setEditingField(null);
                          }} className="glass-button" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'var(--accent-color)' }}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{text}</p>
                    )}
                  </div>
                );
              })}

            </div>
            
            <button onClick={handleSaveTemplate} className="glass-button mt-4 w-full" style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)' }}>
              💾 Save as Template
            </button>
            <button onClick={handleGeneratePdf} className="glass-button mt-2 w-full" style={{ background: 'var(--success-color)' }}>
              <Download size={18} /> Generate PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormEditor;
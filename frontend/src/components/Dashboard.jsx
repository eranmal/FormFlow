import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Upload, FileText, Settings, LayoutDashboard, FileSpreadsheet, Trash2 } from 'lucide-react';
import FormEditor from './FormEditor';

const Dashboard = ({ apiKey, onLogout }) => {
  const [activeTab, setActiveTab] = useState('forms');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [initialFields, setInitialFields] = useState(null);
  const [initialBoxes, setInitialBoxes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
      const stored = JSON.parse(localStorage.getItem('form_templates') || '[]');
      setTemplates(stored);
  }, [activeTab]); // Refresh when coming back to dashboard

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.endsWith('.docx')) {
        setUploadedFile(file);
        setInitialFields(null);
        setInitialBoxes([]);
      } else {
        alert('Please upload a valid PDF or DOCX file.');
      }
    }
  };

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className="glass-panel" style={{ width: '280px', margin: '20px', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)' }}>
          <h2 className="flex items-center gap-2" style={{ margin: 0, fontSize: '1.25rem' }}>
            <FileText color="var(--accent-color)" />
            FormFlow
          </h2>
        </div>

        <nav style={{ flex: 1, padding: '20px 12px' }} className="flex flex-col gap-2">
          <button 
            onClick={() => { setActiveTab('forms'); setUploadedFile(null); }}
            style={{ 
              background: activeTab === 'forms' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === 'forms' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: 'none', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', transition: 'all 0.2s',
              textAlign: 'left', width: '100%'
            }}
          >
            <LayoutDashboard size={18} />
            My Forms
          </button>
          
          <button 
            onClick={() => setActiveTab('settings')}
            style={{ 
              background: activeTab === 'settings' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === 'settings' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: 'none', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', transition: 'all 0.2s',
              textAlign: 'left', width: '100%'
            }}
          >
            <Settings size={18} />
            Settings
          </button>
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)' }}>
          <button 
            onClick={onLogout}
            style={{ 
              background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)',
              padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'var(--error-color)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '40px 40px 40px 20px', display: 'flex', flexDirection: 'column' }}>
        
        {activeTab === 'forms' && !uploadedFile && (
          <>
            <header className="mb-8">
              <h1 style={{ fontSize: '2rem' }}>My Forms</h1>
              <p className="text-secondary mt-2">Upload a new form or continue where you left off.</p>
            </header>
            <div className="flex flex-col flex-grow">
              <div 
                className="glass-panel flex flex-col items-center justify-center animate-fade-in" 
                style={{ border: '2px dashed var(--accent-color)', padding: '60px 40px', cursor: 'pointer', background: 'rgba(59, 130, 246, 0.05)', transition: 'all 0.3s' }}
                onClick={() => fileInputRef.current?.click()}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'}
              >
                <div style={{ background: 'var(--accent-color)', padding: '16px', borderRadius: '50%', marginBottom: '20px', color: 'white' }}>
                  <Upload size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Upload a new form</h3>
                <p className="text-secondary text-center max-w-md">Drag and drop your PDF or DOCX file here, or click to browse your files. Our AI will automatically analyze the structure.</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept=".pdf,.docx" 
                  onChange={handleFileChange} 
                />
                <button className="glass-button mt-8">Select File</button>
              </div>

              {templates.length > 0 && (
                  <div className="mt-8 animate-fade-in">
                      <h3 className="mb-4">Saved Templates</h3>
                      <div className="flex flex-col gap-4">
                          {templates.map(t => (
                              <div key={t.id} className="glass-panel flex items-center justify-between" style={{ padding: '16px 24px' }}>
                                  <div className="flex items-center gap-4">
                                      <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px' }}>
                                          <FileSpreadsheet color="var(--accent-color)" />
                                      </div>
                                      <div>
                                          <h4 style={{ margin: 0 }}>{t.filename}</h4>
                                          <p className="text-secondary" style={{ fontSize: '0.85rem', margin: 0 }}>{t.fields.length} fields · {t.boxes.length} mapped boxes</p>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <button 
                                        onClick={() => {
                                            const bstr = atob(t.pdfBase64.split(',')[1]);
                                            let n = bstr.length;
                                            const u8arr = new Uint8Array(n);
                                            while(n--){ u8arr[n] = bstr.charCodeAt(n); }
                                            const file = new File([u8arr], t.filename, { type: 'application/pdf' });
                                            setInitialFields(t.fields);
                                            setInitialBoxes(t.boxes);
                                            setUploadedFile(file);
                                        }}
                                        className="glass-button" style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                      >
                                          Use Template
                                      </button>
                                      <button 
                                        onClick={() => {
                                            const updated = templates.filter(temp => temp.id !== t.id);
                                            localStorage.setItem('form_templates', JSON.stringify(updated));
                                            setTemplates(updated);
                                        }}
                                        className="glass-button" style={{ padding: '8px 12px', background: 'transparent', border: '1px solid var(--error-color)', color: 'var(--error-color)' }}
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'forms' && uploadedFile && (
          <FormEditor file={uploadedFile} apiKey={apiKey} onBack={() => setUploadedFile(null)} initialFields={initialFields} initialBoxes={initialBoxes} />
        )}

        {activeTab === 'settings' && (
          <>
            <header className="mb-8">
              <h1 style={{ fontSize: '2rem' }}>Settings</h1>
              <p className="text-secondary mt-2">Manage your application preferences and API key.</p>
            </header>
            <div className="glass-panel animate-fade-in" style={{ padding: '32px' }}>
              <h3 className="mb-4">API Configuration</h3>
              <div className="flex flex-col gap-2">
                <label className="text-secondary">Google Gemini API Key</label>
                <div className="flex gap-4">
                  <input 
                    type="password" 
                    value={apiKey} 
                    readOnly 
                    className="glass-input" 
                    style={{ opacity: 0.7 }}
                  />
                  <button 
                    onClick={onLogout}
                    className="glass-button" 
                    style={{ background: 'var(--error-color)', whiteSpace: 'nowrap' }}
                  >
                    Clear Key
                  </button>
                </div>
                <p className="text-secondary mt-2" style={{ fontSize: '0.85rem' }}>
                  Your API key is stored securely in your browser's local storage.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

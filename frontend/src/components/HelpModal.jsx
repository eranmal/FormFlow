import React from 'react';
import { X, ExternalLink } from 'lucide-react';

const HelpModal = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>
        
        <h2 className="mb-4">How to get a Gemini API Key</h2>
        
        <div className="flex flex-col gap-4">
          <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.03)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Step 1</h3>
            <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
              Press this link: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="flex items-center gap-1" style={{ display: 'inline-flex' }}>Google AI Studio <ExternalLink size={14}/></a>
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.03)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Step 2</h3>
            <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
              Sign in with your Google account and click on the <strong>"Create API key"</strong> button.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.03)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Step 3</h3>
            <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
              Copy the generated key (it usually starts with <code>AIzaSy...</code>) and paste it in the field on the previous screen.
            </p>
          </div>
        </div>

        <button onClick={onClose} className="glass-button w-full mt-8">
          Got it
        </button>
      </div>
    </div>
  );
};

export default HelpModal;

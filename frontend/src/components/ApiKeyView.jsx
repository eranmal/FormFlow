import React, { useState } from 'react';
import { Key, ArrowRight, ShieldCheck } from 'lucide-react';
import HelpModal from './HelpModal';

const ApiKeyView = ({ onSave }) => {
  const [inputValue, setInputValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSave(inputValue.trim());
    }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh', padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '480px', width: '100%', padding: '40px' }}>
        <div className="flex flex-col items-center mb-8">
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: '50%', marginBottom: '16px' }}>
            <Key size={32} color="var(--accent-color)" />
          </div>
          <h1 className="text-center" style={{ fontSize: '2rem', marginBottom: '8px' }}>Welcome to FormFlow</h1>
          <p className="text-secondary text-center">AI-Powered Professional Form Automation</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="apiKey" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Google Gemini API Key
            </label>
            <input
              id="apiKey"
              type="password"
              className="glass-input"
              placeholder="AIzaSy..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="glass-button w-full mt-4">
            Start Automating
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-4 text-center">
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' }}
          >
            Don't know how to get it?
          </button>
        </div>

        <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
          <div className="flex items-start gap-2 text-secondary">
            <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--success-color)' }} />
            <p>
              The key you put is local on your computer only and the info doesn't pass forward. Don't believe me? You don't need to, just get into my <a href="https://github.com" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>GitHub</a> and see the code yourself :)
            </p>
          </div>
        </div>
      </div>

      {isModalOpen && <HelpModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default ApiKeyView;

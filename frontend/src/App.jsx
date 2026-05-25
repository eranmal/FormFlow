import { useState, useEffect } from 'react';
import ApiKeyView from './components/ApiKeyView';
import Dashboard from './components/Dashboard';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for API key on mount
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
    setIsLoading(false);
  }, []);

  const handleSaveApiKey = (key) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>Loading...</div>;
  }

  return (
    <div className="app-container">
      {!apiKey ? (
        <ApiKeyView onSave={handleSaveApiKey} />
      ) : (
        <Dashboard apiKey={apiKey} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;

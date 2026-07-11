import React from 'react';
import ReactDOM from 'react-dom/client';
import './global.css';
import App from './App';
import { ToastProvider } from './components/Toast';
import { SettingsProvider, useSettings } from './hooks/useSettings';
import PasswordGate from './components/PasswordGate';

// Re-renders App (passing the settings version) whenever workspace settings
// change, so live-bound config (stages, segments, name, colors) refreshes.
// PasswordGate wraps the app so a workspace password (if set) is required
// before anything renders — except the public #intake form.
function ThemedApp() {
  const { version } = useSettings();
  return (
    <PasswordGate>
      <App settingsVersion={version} />
    </PasswordGate>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ToastProvider>
    <SettingsProvider>
      <ThemedApp />
    </SettingsProvider>
  </ToastProvider>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import './global.css';
import App from './App';
import { ToastProvider } from './components/Toast';
import { SettingsProvider, useSettings } from './hooks/useSettings';

// Re-renders App (passing the settings version) whenever workspace settings
// change, so live-bound config (stages, segments, name, colors) refreshes.
function ThemedApp() {
  const { version } = useSettings();
  return <App settingsVersion={version} />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ToastProvider>
    <SettingsProvider>
      <ThemedApp />
    </SettingsProvider>
  </ToastProvider>
);

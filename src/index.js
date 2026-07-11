import React from 'react';
import ReactDOM from 'react-dom/client';
import './global.css';
import App from './App';
import { ToastProvider } from './components/Toast';
import { SettingsProvider, useSettings } from './hooks/useSettings';
import AuthGate from './components/AuthGate';

// Re-renders App (passing the settings version) whenever workspace settings
// change, so live-bound config (stages, segments, name, colors) refreshes.
// AuthGate wraps the app so a signed-in Supabase user is required before
// anything renders — except the public #intake form.
function ThemedApp() {
  const { version } = useSettings();
  return (
    <AuthGate>
      <App settingsVersion={version} />
    </AuthGate>
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

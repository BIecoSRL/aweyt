import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from '@/App';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueueProvider } from '@/contexts/QueueContext';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <QueueProvider>
          <App />
        </QueueProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
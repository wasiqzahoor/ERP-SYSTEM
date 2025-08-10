// client/src/index.js (or src/main.jsx)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // <--- Import AuthProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Wrap App with AuthProvider */}
      <AuthProvider> {/* <--- Add AuthProvider here */}
        <App />
      </AuthProvider> {/* <--- Close AuthProvider here */}
    </BrowserRouter>
  </React.StrictMode>,
);
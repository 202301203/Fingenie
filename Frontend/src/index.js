import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // ✅ ADD THIS IMPORT
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '972027062493-i944gk25qhn7qj8ut7ebu6jdnpud8des.apps.googleusercontent.com';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter> {/* ✅ ADD THIS WRAPPER */}
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    </BrowserRouter> {/* ✅ CLOSE THE WRAPPER */}
  </React.StrictMode>
);
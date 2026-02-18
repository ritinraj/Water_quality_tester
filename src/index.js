/**
 * index.js
 * ---------
 * Entry point for the React application.
 * Renders the <App /> component into the #root div in public/index.html.
 *
 * GoogleOAuthProvider wraps the entire app so any component can
 * trigger Google Sign-In using the @react-oauth/google library.
 *
 * ⚠️  Replace REACT_APP_GOOGLE_CLIENT_ID in your .env file with
 *     your actual Client ID from Google Cloud Console.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

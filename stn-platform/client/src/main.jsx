import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

document.addEventListener('focusin', (e) => {
  if (e.target.tagName === 'INPUT' && e.target.type === 'number') {
    e.target.select();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

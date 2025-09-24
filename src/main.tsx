// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { ToastProvider } from './components/Toast'
import './index.css'
import 'react-loading-skeleton/dist/skeleton.css'


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>        {/* 👈 wraps the whole app */}
        <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
)

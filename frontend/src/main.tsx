
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 2. ENVOLVA O APP COM O THEMEPROVIDER AQUI */}
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)

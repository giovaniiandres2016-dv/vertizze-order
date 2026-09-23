// ============================================================================
// ARCHIVO: src/main.jsx
// DESCRIPCIÓN: Punto de entrada principal de React. Aquí se monta la aplicación
//              y se importan los estilos globales de Tailwind (index.css).
// ============================================================================

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // <-- ¡Esta línea es la que activa los estilos en toda la app!

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
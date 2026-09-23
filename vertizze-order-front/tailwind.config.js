// ============================================================================
// ARCHIVO: tailwind.config.js
// DESCRIPCIÓN: Archivo de configuración oficial para Tailwind CSS.
//              Le indica al motor dónde buscar las clases para aplicarlas.
// ============================================================================

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
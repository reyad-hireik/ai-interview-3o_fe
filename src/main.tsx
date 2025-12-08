import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { CssBaseline, ThemeProvider } from 'convertupleads-theme'

createRoot(document.getElementById('root')!).render(
    <ThemeProvider>
        <CssBaseline />
        <App />
    </ThemeProvider>,
)

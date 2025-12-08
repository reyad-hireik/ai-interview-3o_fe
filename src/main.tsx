import { CssBaseline, ThemeProvider } from 'convertupleads-theme'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
    <ThemeProvider>
        <CssBaseline />
        <App />
    </ThemeProvider>,
)

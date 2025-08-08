import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './assets/css/index.css'
import App from './App.jsx'
import {RateLimitProvider} from "./context/RateLimitContext.jsx";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <RateLimitProvider>
            <App/>
        </RateLimitProvider>
    </StrictMode>,
)

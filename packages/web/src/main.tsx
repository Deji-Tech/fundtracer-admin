import React from 'react';
import ReactDOM from 'react-dom/client';
import './web3modal.config'; // Initialize Web3Modal
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './styles/variables.css';
import './styles/components.css';
import './styles/animations.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>
);

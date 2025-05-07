import { createContext, useContext, useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';

const ErrorContext = createContext();

export const ErrorProvider = ({ children }) => {
    const [error, setError] = useState(null);

    const showError = (message) => {
        setError(message);
    };

    return (
        <ErrorContext.Provider value={{ showError }}>
            {children}
            {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
        </ErrorContext.Provider>
    );
};

export const useError = () => {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error('useError must be used within an ErrorProvider');
    }
    return context;
}; 
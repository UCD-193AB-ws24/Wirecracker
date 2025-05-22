import { createContext, useContext, useState } from 'react';
import WarningMessage from '../components/WaningMessage';

const WarningContext = createContext();

export const WarningProvider = ({ children }) => {
    const [warning, setWarning] = useState(null);

    const showWarning = (message) => {
        setWarning(message);
    };

    return (
        <WarningContext.Provider value={{ showWarning }}>
            {children}
            {warning && <WarningMessage message={warning} onClose={() => setWarning(null)} />}
        </WarningContext.Provider>
    );
};

export const useWarning = () => {
    const context = useContext(WarningContext);
    if (!context) {
        throw new Error('useWarning must be used within an WarningProvider');
    }
    return context;
};

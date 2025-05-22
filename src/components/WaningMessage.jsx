import { useState, useEffect } from 'react';

const WarningMessage = ({ message, onClose, duration = 5000 }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onClose) onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-100 border-b border-orange-400 text-orange-700 px-4 py-3 flex justify-between items-center" role="alert">
            <span className="block sm:inline">{message}</span>
            <button
                className="text-orange-500 hover:text-orange-700 focus:outline-none"
                onClick={() => {
                    setIsVisible(false);
                    if (onClose) onClose();
                }}
            >
                <svg className="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <title>Close</title>
                    <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                </svg>
            </button>
        </div>
    );
};

export default WarningMessage;

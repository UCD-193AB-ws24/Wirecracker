import { useState } from 'react';
import config from '../../config.json';

const backendURL = config.backendURL || 'http://localhost:5000';

const ShareButton = ({ fileId }) => {
    const [showModal, setShowModal] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };

    const handleShare = async () => {
        setError('');
        setIsLoading(true);

        try {
            if (!validateEmail(email)) {
                setError('Invalid email format');
                setIsLoading(false);
                return;
            }

            if (!fileId) {
                setError('No file selected for sharing');
                setIsLoading(false);
                return;
            }

            // First validate email and get user ID
            const validateResponse = await fetch(`${backendURL}/share/validate-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token') // Add token for auth
                },
                body: JSON.stringify({ 
                    email,
                    fileId // Include fileId in validation request
                })
            });

            if (!validateResponse.ok) {
                const text = await validateResponse.text();
                throw new Error(`Server error: ${validateResponse.status} - ${text}`);
            }

            const validateData = await validateResponse.json();

            if (!validateData.valid) {
                setError('Email not found in system');
                return;
            }

            // Create share record and send notification
            const shareResponse = await fetch(`${backendURL}/share/create-share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token')
                },
                body: JSON.stringify({ 
                    email,
                    fileId,
                    permissionLevel: 'view' // Default permission level
                }),
            });

            if (!shareResponse.ok) {
                const text = await shareResponse.text();
                throw new Error(`Failed to create share: ${shareResponse.status} - ${text}`);
            }

            setShowModal(false);
            setEmail('');
            alert('File shared successfully!');
        } catch (error) {
            console.error('Error sharing file:', error);
            setError(error.message || 'Failed to share file. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-sky-700 text-white rounded hover:bg-sky-800 transition-colors"
            >
                Share
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h2 className="text-xl font-bold mb-4">Share File</h2>
                        
                        <div className="flex gap-2 mb-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter email address"
                                className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                            <button
                                onClick={handleShare}
                                disabled={isLoading}
                                className="px-4 py-2 bg-sky-700 text-white rounded hover:bg-sky-800 transition-colors disabled:bg-gray-400"
                            >
                                {isLoading ? 'Sending...' : 'Send'}
                            </button>
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm">{error}</p>
                        )}

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setError('');
                                    setEmail('');
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ShareButton; 
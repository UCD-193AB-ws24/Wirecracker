import { useState } from 'react';
import config from '../../config.json';

const backendURL = config.backendURL || 'http://localhost:5000';

const ShareButton = () => {
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

            const url = `${backendURL}/share/validate-email`;
            console.log('Sending request to:', url);
            
            // First try the test endpoint
            try {
                const testResponse = await fetch(`${backendURL}/share/test`);
                console.log('Test endpoint response:', await testResponse.text());
            } catch (testError) {
                console.error('Test endpoint failed:', testError);
            }

            // Then try the actual endpoint
            const validateResponse = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            console.log('Response status:', validateResponse.status);
            console.log('Response headers:', Object.fromEntries(validateResponse.headers.entries()));

            const responseText = await validateResponse.text();
            console.log('Raw response:', responseText);

            if (!validateResponse.ok) {
                throw new Error(`Server error: ${validateResponse.status} - ${responseText}`);
            }

            let validateData;
            try {
                validateData = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response as JSON:', e);
                throw new Error(`Invalid server response: ${responseText}`);
            }

            if (!validateData.valid) {
                setError('Email not found in system');
                return;
            }

            // Send share notification
            const shareResponse = await fetch(`${backendURL}/share/send-share-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (!shareResponse.ok) {
                const text = await shareResponse.text();
                console.error('Share error response:', text);
                throw new Error(`Failed to send share notification: ${shareResponse.status}`);
            }

            const shareData = await shareResponse.json();
            console.log('Share response:', shareData);

            setShowModal(false);
            setEmail('');
            alert('Share notification sent successfully!');
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
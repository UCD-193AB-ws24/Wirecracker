import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

const SharedFile = () => {
    const { fileId } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                // Check if user is logged in
                const token = localStorage.getItem('token');
                if (!token) {
                    // Save the current URL to redirect back after login
                    localStorage.setItem('redirectAfterLogin', window.location.pathname);
                    navigate('/login');
                    return;
                }

                // Get current user's ID
                const { data: session } = await supabase
                    .from('sessions')
                    .select('user_id')
                    .eq('token', token)
                    .single();

                if (!session) {
                    throw new Error('Invalid session');
                }

                // Check if user has access to this file
                const { data: shareData, error: shareError } = await supabase
                    .from('fileshares')
                    .select('*')
                    .eq('file_id', fileId)
                    .eq('shared_with_user_id', session.user_id)
                    .single();

                if (shareError || !shareData) {
                    throw new Error('You do not have access to this file');
                }

                // Get file data
                const { data: fileData } = await supabase
                    .from('files')
                    .select('*')
                    .eq('file_id', fileId)
                    .single();

                if (!fileData) {
                    throw new Error('File not found');
                }

                // Dispatch event to open the file
                const event = new CustomEvent('openSharedFile', {
                    detail: {
                        fileId: fileId,
                        fileName: fileData.filename
                    }
                });
                window.dispatchEvent(event);

                // Navigate to home after dispatching the event
                navigate('/');

            } catch (error) {
                console.error('Error accessing shared file:', error);
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        checkAccess();
    }, [fileId, navigate]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Loading shared file...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <div className="text-xl text-red-500">{error}</div>
                <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 bg-sky-700 text-white rounded hover:bg-sky-800"
                >
                    Return to Home
                </button>
            </div>
        );
    }

    return null;
};

export default SharedFile; 
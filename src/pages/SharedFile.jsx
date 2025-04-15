import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

const SharedFile = () => {
    const { fileId } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);

    const handleApproveFile = async () => {
        try {
            // Get current user's ID
            const token = localStorage.getItem('token');
            const { data: session } = await supabase
                .from('sessions')
                .select('user_id')
                .eq('token', token)
                .single();

            if (!session) throw new Error('No active session');

            // Remove from fileshares
            const { error: deleteError } = await supabase
                .from('fileshares')
                .delete()
                .eq('file_id', fileId)
                .eq('shared_with_user_id', session.user_id);

            if (deleteError) throw deleteError;

            // Add to approved_files
            const { error: approvedError } = await supabase
                .from('approved_files')
                .insert({
                    file_id: fileId,
                    approved_by_user_id: session.user_id,
                    approved_date: new Date().toISOString()
                });

            if (approvedError) throw approvedError;

            // Close the current tab
            const event = new CustomEvent('closeTab', {
                detail: { fileId }
            });
            window.dispatchEvent(event);

            // Refresh the To Review list
            window.dispatchEvent(new CustomEvent('refreshSharedFiles'));

            // Navigate home
            navigate('/');

        } catch (error) {
            console.error('Error approving file:', error);
            alert('Failed to approve file. Please try again.');
        }
    };

    useEffect(() => {
        const checkAccess = async () => {
            try {
                // Check if user is logged in
                const token = localStorage.getItem('token');
                if (!token) {
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

                // Dispatch event to open the file with isSharedFile flag
                const event = new CustomEvent('openSharedFile', {
                    detail: {
                        fileId: fileId,
                        fileName: fileData.filename,
                        creationDate: fileData.creation_date,
                        modifiedDate: fileData.modified_date,
                        isSharedFile: true
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

    useEffect(() => {
        const handleShowApprovalModal = (event) => {
            if (event.detail.fileId === fileId) {
                setShowApprovalModal(true);
            }
        };

        window.addEventListener('showApprovalModal', handleShowApprovalModal);
        return () => {
            window.removeEventListener('showApprovalModal', handleShowApprovalModal);
        };
    }, [fileId]);

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

    if (showApprovalModal) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
                    <h2 className="text-xl font-bold mb-4">Approve File</h2>
                    <p className="mb-6 text-gray-600">
                        Once you approve this file, you will not be able to view or suggest changes 
                        unless the owner shares it with you again. Would you like to proceed?
                    </p>
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={() => setShowApprovalModal(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApproveFile}
                            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Approve
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default SharedFile; 
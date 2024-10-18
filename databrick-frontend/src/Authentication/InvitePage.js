import React, { useEffect, useState } from 'react';
import axios from '../http';
import './InvitePage.css';

const InvitePage = ({email}) => {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const activateAccount = async () => {
            if (!email) {
                setError('Invalid invitation link');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await axios.get(`auth/invite/${encodeURIComponent(email)}/`);
                setMessage(response.data.message);
            } catch (err) {
                if (err.response) {
                    setError(err.response.data.message || 'You have successfully accepted the invitation to become an artist. Please return to the homepage and log in with your account.');
                } else if (err.request) {
                    setError('No response from server. Please check your network connection.');
                } else {
                    setError('An unexpected error occurred.');
                }
            } finally {
                setLoading(false);
            }
        };

        setError(null);
        setMessage('');
        activateAccount();
    }, [email]);

    if (loading) {
        return <div className="invite-container"><p>Loading...</p></div>;
    }

    if (error) {
        return <div className="invite-container"><p className="error-message">{error}</p></div>;
    }

    return (
        <div className="invite-container">
            <h2>{message}</h2>
        </div>
    );
};

export default InvitePage;
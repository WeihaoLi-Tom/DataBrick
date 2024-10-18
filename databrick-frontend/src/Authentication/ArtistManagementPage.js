import React, { useState, useEffect } from 'react';
import axios from '../http';

import { AccessControlWrapper } from '../components/NoAccess';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import './ArtistManagementPage.css';

const ArtistManagementPage = () => {
    const [inviteEmail, setInviteEmail] = useState('');
    const [removeEmail, setRemoveEmail] = useState('');
    const [message, setMessage] = useState('');
    const role = localStorage.getItem('userRole');

    useEffect(() => {
        setInviteEmail('');
        setRemoveEmail('');
        setMessage('');
    }, []);

    const handleInviteArtist = async () => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await axios.post(
                'auth/invite-artist/',
                { email: inviteEmail }
            );
            setMessage('Invitation sent successfully!');
            setInviteEmail('');
        } catch (error) {
            setMessage(`Failed to send invitation: ${error.response?.data?.error || error.response?.error || 'Unexpected error'}`);
        }
    };


    const handleRemoveArtist = async () => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await axios.post(
                'auth/remove-artist/',
                { email: removeEmail }
            );
            setMessage('Artist removed successfully!');
            setRemoveEmail('');
        } catch (error) {
            const extraInfo = error.response?.status === 404 ? ': Artist does not exist.' : '.'
            setMessage(`Failed to remove artist${extraInfo}`);
        }
    };

    // Function to determine if user should have access
    function userAccess() {
        // Only allow admin access
        return (role === 'admin');
    }

    return (
        // User access control - only admins may access this page */}
        <AccessControlWrapper hasAccess={userAccess()}>
            <div className="management-container">
                <h2>Artist Management</h2>

                <div>
                    <h3>Invite Artist</h3>
                    <Input
                        type="email"
                        placeholder="Enter artist email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        size="large"
                    />
                    <Button onClick={handleInviteArtist} label={"Send Invitation"} size='large' />
                </div>

                <div>
                    <h3>Remove Artist</h3>
                    <Input
                        type="email"
                        placeholder="Enter artist email"
                        value={removeEmail}
                        onChange={(e) => setRemoveEmail(e.target.value)}
                        size="large"
                    />
                    <Button onClick={handleRemoveArtist} label={"Remove Artist"} size='large' />
                </div>

                {message && <p>{message}</p>}
            </div>
        </AccessControlWrapper>
    );
};

export default ArtistManagementPage;
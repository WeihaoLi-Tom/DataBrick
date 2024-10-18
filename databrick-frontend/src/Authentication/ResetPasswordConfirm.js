import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../http';

import './ResetPasswordConfirm.css'

const ResetPasswordConfirm = () => {
    const [resetFeedback, setResetFeedback] = useState('');
    const { token } = useParams();


    useEffect(() => {
        const resetPassword = async () => {
            try {
                const response = await axios.post(`auth/reset-password-confirm/${token}/`);
                setResetFeedback(response?.data?.message || '');
            } catch (error) {
                alert(error.response.data.error || 'An error occurred while resetting the password.');
            }
        };

        resetPassword();
    }, [token]);

    return (
    <div className='reset-page'>
        <h1 className='reset-feedback'>{resetFeedback ? resetFeedback : 'Resetting your password...'}</h1>
    </div>);
};

export default ResetPasswordConfirm;
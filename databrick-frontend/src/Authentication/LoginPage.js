import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../http';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import './LoginPage.css';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [requestSent, setRequestSent] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            setIsLoggedIn(true);
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        }
    }, []);

    const handleLogin = async () => {
        try {
            const response = await axios.post('auth/login/', { username, password, verification_code: verificationCode });
            localStorage.setItem('accessToken', response.data.access_token);
            localStorage.setItem('refreshToken', response.data.refresh_token);
            localStorage.setItem('userRole', response.data.role);
            localStorage.setItem('userId', response.data.user_id);
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.access_token;
            setErrorMessage('');
            setIsLoggedIn(true);
            navigate('/control-panel');
        } catch (error) {
            console.error('Login error:', error);
            setErrorMessage('Login failed. Please check your credentials or verification code.');
        }
    };

    const handleSendCode = async () => {
        try {
            const response = await axios.post('auth/send-code/', { username });
            setIsCodeSent(true);
            setErrorMessage('');
            alert('Verification code sent to your email.');
        } catch (error) {
            console.log(error)
            setErrorMessage(`Failed to send verification code: ${error.response?.data?.error || error.response?.error || 'Please check your email.'}`);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setErrorMessage('New password and confirmation do not match.');
            return;
        }

        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await axios.post(
                'auth/change-password/',
                { old_password: oldPassword, new_password: newPassword }
            );

            const { access_token, refresh_token } = response.data;
            localStorage.setItem('accessToken', access_token);
            localStorage.setItem('refreshToken', refresh_token);
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;

            setErrorMessage('');
            alert('Password changed successfully');
            setIsChangingPassword(false);
        } catch (error) {
            console.error('Change password error:', error);
            setErrorMessage('Failed to change password. Please check your current password.');
        }
    };

    const handleRequestPasswordChange = async () => {
        try {
            const response = await axios.post(
                'auth/request-password-change/',
                { email: forgotPasswordEmail }
            );
            setErrorMessage('');
            setRequestSent(true);
            setForgotPasswordEmail('');
            alert('Password reset request sent to your email.');
        } catch (error) {
            console.error('Request password change error:', error);
            setErrorMessage(`Failed to send password reset email: ${error.response?.data?.error || error.response?.error || 'Please check your email.'}`);
        }
    };

    const handleLogout = () => {
        // Remove all stored login details
        setErrorMessage('');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        setIsLoggedIn(false);
        setUsername('');
        setPassword('');
    };

    return (
        <div className="login-container">
            <h2>{isChangingPassword ? 'Change Password' : 'Login'}</h2>
            {errorMessage && <div className="error-message">{errorMessage}</div>}

            {/* Interface when not logged in */}
            {!isLoggedIn && (
                <>
                    <Input
                        type="text"
                        placeholder="Username/Email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        size='large'
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        size='large'
                    />
                    {!isCodeSent && (
                        <Button onClick={handleSendCode} disabled={!username.trim()} label={"Send Verification Code"} size='large' />
                    )}
                    {isCodeSent && (
                        <>
                            <Input
                                type="text"
                                placeholder="Verification Code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                size='large'
                            />
                            <Button onClick={handleLogin} label={"Login"} size='large' />
                        </>
                    )}

                    {/* Forgot password function */}
                    <h3>Forgot Password?</h3>
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        size='large'
                    />
                    <Button onClick={handleRequestPasswordChange} disabled={!forgotPasswordEmail.trim()}
                        label={requestSent ? 'Request Sent' : 'Request Password Change'}
                        size='large'
                    />
                </>
            )}

            {/* */}
            {isLoggedIn && (
                <>
                    {isChangingPassword ? (
                        <>
                            {/* Enter old password */}
                            <Input
                                type="password"
                                placeholder="Current Password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                size='large'
                            />
                            {/* Enter new password */}
                            <Input
                                type="password"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                size='large'
                            />
                            <Input
                                type="password"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                size='large'
                            />
                            <Button onClick={handleChangePassword} label={"Change Password"} size='large' />
                            {/* Back button */}
                            <Button onClick={() => {
                                setIsChangingPassword(false);
                                setErrorMessage('');
                            }} label={"Back"} size='large' />
                        </>
                    ) : (
                        <>
                            {/* Change password button */}
                            <Button onClick={() => {
                                setIsChangingPassword(!isChangingPassword);
                                setErrorMessage('');
                            }}
                                label={isChangingPassword ? 'Back to Dashboard' : 'Change Password'}
                                size='large'
                            />

                            {/* Logout button */}
                            <Button onClick={handleLogout} label={"Logout"} size='large' />
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default LoginPage;
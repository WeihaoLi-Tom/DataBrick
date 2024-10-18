// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

import HomePage from './HomePage';
import ControlPanel from './ControlPanel';
import LoginPage from "./Authentication/LoginPage";
import InvitePage from './Authentication/InvitePage';
import ArtistAssignPage from './Authentication/ArtistAssignPage';
import ArtistManagementPage from './Authentication/ArtistManagementPage';
import ResetPasswordConfirm from './Authentication/ResetPasswordConfirm';
import ShowManagementPage from './Shows/ShowManagementPage';
import ShowDetailsPage from './Shows/ShowDetailsPage';
import VideoPage from './VideoPage/VideoPage';
import BrickPage from './BrickPage/BrickPage';

import { Button } from './components/Button';
import './App.css'; 

// Header
const Header = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('accessToken');

    const handleBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/';
        }
    };

    return (
        <header className="header">
            <div className="logo">
                <a href="https://melbourne.sciencegallery.com/" className="logo-link">
                    <img src="/logos/SGLogo_Black_Transparent.png" alt="Science Gallery logo" />
                </a>
            </div>
            <nav className="nav-bar">
                <Button className="nav-button" onClick={() => navigate('/')} label="Home" />
                {/* Display Login button instead if not logged in */}
                {token ? (
                    <Button className="nav-button" onClick={() => navigate('/control-panel')} label="Control Panel" />
                ) : (
                    <Button className="nav-button" onClick={() => navigate('/login-page')} label="Login" />
                )}
                <Button className="back-button" onClick={handleBack} label="Back"/>
            </nav>
            <div className="unimelb">
                <a href="https://www.unimelb.edu.au/" className="logo-link">
                    <img src="/logos/university_logo.webp" alt="Unimelb logo" />
                </a>
            </div>
        </header>
    );
};

const App = () => {
    const [page, setPage] = useState('home');
    const [email, setEmail] = useState('');

    const handleNavigation = (path) => {
        const pathSegments = path.split('/');
        if (pathSegments[1] === 'invite' && pathSegments[2]) {
            const decodedEmail = decodeURIComponent(pathSegments[2]);
            setEmail(decodedEmail);
            setPage('invite');
        } else if (path === '/artist-management') {
            setPage('artist-management');
        } else {
            setPage('home');
        }
    };

    useEffect(() => {
        try {
            const path = window.location.pathname;
            handleNavigation(path);

            const handlePopState = () => {
                handleNavigation(window.location.pathname);
            };
            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('popstate', handlePopState);
            };
        } catch (error) {
            console.error("Error parsing URL:", error);
            setPage('home');
        }
    }, []);

    return (
        <Router>
            <div className="App">
                <Header />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/invite/:email" element={<InvitePage email={email} />} />
                    <Route path="/artist-management" element={<ArtistManagementPage />} />
                    <Route path="/login-page" element={<LoginPage />} />
                    <Route path="/control-panel" element={<ControlPanel />} />
                    <Route path="/show-page" element={<ShowManagementPage />} />
                    <Route path="/showdetails/:showId" element={<ShowDetailsPage />} />
                    <Route path="/video-page/:showId" element={<VideoPage />} />
                    <Route path="/brick-page" element={<BrickPage/>}/>
                    <Route path="/assign-artist" element={<ArtistAssignPage />} />
                    <Route path="/reset-password-confirm/:token" element={<ResetPasswordConfirm />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;

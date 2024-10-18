import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./components/Button";

import "./HomePage.css";

// Possible background images
const imagePaths = [
    "/backgrounds/bricks_1.jpg",
    "/backgrounds/bricks_2.jpg",
    "/backgrounds/bricks_3.jpg",
    "/backgrounds/bricks_4.jpg",
    "/backgrounds/bricks_5.jpg",
    "/backgrounds/bricks_6.jpg",
    "/backgrounds/bricks_7.jpg",
];

const getRandomImage = () => {
    // Get a random index
    const randomIndex = Math.floor(Math.random() * imagePaths.length);
    return imagePaths[randomIndex];
};

// Main Section Backgroung image
const MainSectionBackground = () => {
    const backgroundImage = getRandomImage();

    return (
        <div className="main-section-background">
            <img 
                src={backgroundImage}
                alt="databrick background"
            />
        </div>
    );
};

// Main Section
const MainSection = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('accessToken'); // Retrieve token to check login status

    const handleLoginClick = () => {
        if (token) {
            // If the user is already logged in, redirect to the control panel
            navigate('/control-panel');
        } else {
            // Otherwise, go to the login page
            navigate('/login-page');
        }
    };

    return (
        <div className="main-section">
            <h1 className="title">DATABRICK</h1>
            <Button className="login-button" onClick={handleLoginClick} label="Login" size='large'/>
        </div>
    );
};

const HomePage = () => {
    return(
        <>
            <MainSectionBackground/>
            <MainSection/>
        </>
    );
}

export default HomePage;
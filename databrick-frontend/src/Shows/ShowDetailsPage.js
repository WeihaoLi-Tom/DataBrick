import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../http';

import { AccessControlWrapper } from '../components/NoAccess';
import { Button } from '../components/Button';
import './ShowDetailsPage.css';
import { Input } from '../components/Input';

function ShowDetailsPage() {
    const { showId } = useParams(); // get showId
    const [show, setShow] = useState(null);
    const [description, setDescription] = useState('');
    const [frameCount, setFrameCount] = useState(''); 
    const [previousFrameCount, setPreviousFrameCount] = useState(''); 
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [assignedArtistId, setArtist] = useState('');

    const role = localStorage.getItem('userRole');
    const currentUserId = role === 'artist' ? localStorage.getItem('userId') : null;


    useEffect(() => {
        // Fetch show information using axios
        const fetchShowDetails = async () => {
            try {
                const response = await axios.get(`api/shows/${showId}/`);
                const showData = response.data;  
                setShow(showData);
                setDescription(showData.description);
                setFrameCount(showData.frame_count);
                setPreviousFrameCount(showData.frame_count); 
                setArtist(showData.artist);
            } catch (error) {
                setMessage('Failed to fetch show details.');
            }
        };
    
        fetchShowDetails();
    }, [showId]); 

    const handleEditDescription = async () => {
        // Warning message for destructive action: video removal w/ frame change
        if (frameCount !== previousFrameCount) {
            const confirmed = window.confirm('The frame count has changed. This will delete all associated videos. Do you want to proceed?');
            if (!confirmed) return;
        }

        try {
            const formData = new FormData();
            formData.append('description', description);
            formData.append('frame_count', frameCount); 

            const response = await axios.patch(`api/shows/${showId}/`, formData);

            if (response.status === 200) {
                setMessage('Details updated successfully!');
                // Update show details without refresh
                setShow(prevShow => ({
                    ...prevShow, // Spread existing show data
                    description: description, // Update the description
                    frame_count: frameCount // Update the frame_count
                }));
                setIsEditing(false); // edit is not allowed
                setPreviousFrameCount(frameCount)
            } else {
                setMessage('Error updating description.');
            }
        } catch (error) {
            setMessage('Failed to update description.');
        }
    };

    // download all the videos
    const handleDownloadAllVideos = () => {
        axios({
            url: `api/shows/${showId}/download_all_videos/`,  
            method: 'GET',
            responseType: 'blob',  
        })
        .then(response => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `show_${showId}_videos.zip`); 
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch(error => {
            console.error("Error downloading videos:", error);
        });
    };

    if (!show) {
        return <div>Loading show details...</div>;
    }

    // Function to determine if editing show files should be locked.
    function editLocked(show_status) {
        // Lock if show is approved or pending approval
        if (show_status === 'approved' || show_status === 'pending_approval') return true;
    }

    // Function to determine if a user has access to this page
    function userAccess() {
        // Never lock out admin
        if (role === 'admin') return true;
        // If no artist assigned, lock
        if (assignedArtistId === null) return false;
        // Otherwise allow show access if assigned to user
        return (currentUserId === assignedArtistId);
    }

    return (
        <AccessControlWrapper hasAccess={userAccess()}>
            <div className="showdetails-container">
                <h1 className='showdetails-title'>Show Details for Show ID: {showId}</h1>
                <div className="showdetails-content">
                    {/* Uploaded picture */}
                    {show.image && (
                        <div className="showdetails-image">
                            <img src={show.image} alt={show.title} />
                        </div>
                    )}

                    <div className="showdetails-info">
                        <p><strong>SHOWID:</strong> {show.id}</p>
                        <p><strong>Show Name:</strong> {show.title}</p>
                        <p>
                            <strong>Show Dates:</strong>
                            {new Date(show.start_date).toLocaleDateString()} - {new Date(show.end_date).toLocaleDateString()}
                        </p>

                        <p><strong>Description:</strong></p>
                        {isEditing ? (
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        ) : (
                            <p>{show.description}</p>
                        )}
                        <p><strong>Frame Count:</strong></p>

                        {/* Check for edit lock on show frame count */}
                        {isEditing && !editLocked(show.status) ? (
                                <Input
                                    type="text" 
                                    value={frameCount}
                                    onChange={(e) => {
                                        // Only allow numbers for input
                                        const value = e.target.value;
                                        if (/^\d*$/.test(value)) {
                                            setFrameCount(value);
                                        }
                                    }}
                                    className="frame-input"
                                    placeholder="Enter frame count"
                                    size="large"
                                />
                        ) : (
                            <p>{show.frame_count}</p>
                        )}

                        {/* Access to editing must be checked before loading buttons */}
                        <div>
                            {isEditing ? (
                                <Button onClick={handleEditDescription} label={'Save Changes'}/>
                            ) : (
                                <Button onClick={() => setIsEditing(true)} label={'Edit Details'}/>
                            )}
                            <p>{message}</p>
                            <div>
                                <Button className='download-all-button' onClick={handleDownloadAllVideos}
                                    label={'Download All Videos'}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AccessControlWrapper>
    );
}

export default ShowDetailsPage;

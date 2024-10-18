import React, { useState, useEffect } from 'react';
import axios from '../http';
import axiosInstance from '../http';
import Wall from './Wall';
import "./WallContainer.css";



const WallContainer = ({ videos, locations, setLocations, brokenBricks, showId, handleDropFromVideoList, viewingStatus, editingControl = false  }) => {
    const [draggingVideo, setDraggingVideo] = useState(null);
    const [draggingSrc, setDraggingSrc] = useState(null);
    const [previewFrames, setPreviewFrames] = useState({}); // Store preview frame

    // Helper function to reduce code repetition
    const resetModal = (status = null) => {
        setDraggingVideo(null);
        setDraggingSrc(null);
    }

    useEffect(() => {
        videos.forEach(video => {
            setPreviewFrames(prevFrames => ({
                ...prevFrames,
                [video.id]: `${axiosInstance.defaults.baseURL}api/videos/${video.id}/frame/?frame=0` // frame number need to be changed when show management is implemented
            }));
        });
    }, [videos]);

    // start dragging
    const handleDragStart = (e, video, srcNumber) => {
        if (!editingControl) return;  // Disable drag if editing is not allowed
        e.dataTransfer.setData("text/plain", video.file); // set dragging icon 
        setDraggingVideo(video);
        setDraggingSrc(srcNumber);
    };

    // update video locations when dropped
    const handleDrop = (destNumber) => {
        if (!editingControl) return;  // Disable drop if editing is not allowed

        // Function to update the video location
        const updateLocationOnBackend = (locationNumber, updatedLocationData) => {
            axios.patch(`api/shows/${showId}/locations/location_number=${locationNumber}/`, updatedLocationData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
                .then(response => {
                    console.log('Video location updated:', response.data);
                })
                .catch(error => {
                    console.error('Failed to update video location:', error);
                });
        };

        if (draggingVideo) {

            if (destNumber < 0) {
                resetModal();
                return;
            }

            if (draggingSrc < 0) {
                const destBrick = locations.find(location => location.location_number === destNumber)

                if (!destBrick.video) {
                    // Update the destination location with the dragged video
                    setLocations(prevLocations =>
                        prevLocations.map(location =>
                            location.location_number === destNumber
                                ? { ...location, video: draggingVideo.id } // Assign video to new location
                                : location
                        )
                    );

                    // Update the new location on the backend
                    updateLocationOnBackend(destNumber, { video: draggingVideo.id });
                }

                resetModal();
                return;
            }

            // Update the video's locations, considering the target wall
            const destBrick = locations.find(location => location.location_number === destNumber)

            if (destBrick && destBrick.video) {
                // Update the previous location by setting video to null
                setLocations(prevLocations =>
                    prevLocations.map(location =>
                        location.location_number === draggingSrc
                            ? { ...location, video: destBrick.video } // Clear previous video assignment
                            : location
                    )
                );

                // Update the previous location on the backend
                updateLocationOnBackend(draggingSrc, { video: destBrick.video });

                // Update the destination location with the dragged video
                setLocations(prevLocations =>
                    prevLocations.map(location =>
                        location.location_number === destNumber
                            ? { ...location, video: draggingVideo.id } // Assign video to new location
                            : location
                    )
                );

                // Update the new location on the backend
                updateLocationOnBackend(destNumber, { video: draggingVideo.id });
            }
            else {
                // Update the previous location by setting video to null
                setLocations(prevLocations =>
                    prevLocations.map(location =>
                        location.location_number === draggingSrc
                            ? { ...location, video: '' } // Clear previous video assignment
                            : location
                    )
                );

                // Update the previous location on the backend
                updateLocationOnBackend(draggingSrc, { video: '' });

                // Update the destination location with the dragged video
                setLocations(prevLocations =>
                    prevLocations.map(location =>
                        location.location_number === destNumber
                            ? { ...location, video: draggingVideo.id } // Assign video to new location
                            : location
                    )
                );

                // Update the new location on the backend
                updateLocationOnBackend(destNumber, { video: draggingVideo.id });
            }
        }
        else {
            handleDropFromVideoList(destNumber);
        }
        // Reset the dragging state
        resetModal();
    };

    const handleRemove = (brickNumber) => {
        if (!editingControl) return;  // Disable remove if editing is not allowed

        setLocations(prevLocations =>
            prevLocations.map(location =>
                location.location_number === brickNumber
                    ? { ...location, video: null }
                    : location
            )
        );

        axios.patch(`api/shows/${showId}/locations/location_number=${brickNumber}/`, { video: '' }, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        }
        )
            .then(response => {
                console.log('Video location updated:', response.data);
            })
            .catch(error => {
                console.error('Failed to update video location:', error);
            });
    }

    return (
        <div className="walls-container">
            <div className='wall-container-content'>
                    <Wall
                        isWest={true}
                        videos={videos}
                        locations={locations}
                        brokenBricks={brokenBricks}
                        previewFrames={previewFrames}
                        onRemove={handleRemove}
                        onDragStart={handleDragStart}
                        onDrop={handleDrop}
                        viewingStatus={viewingStatus}
                        editingControl={editingControl}
                    />
                    <Wall
                        isWest={false}
                        videos={videos}
                        locations={locations}
                        brokenBricks={brokenBricks}
                        previewFrames={previewFrames}
                        onRemove={handleRemove}
                        onDragStart={handleDragStart}
                        onDrop={handleDrop}
                        viewingStatus={viewingStatus}
                        editingControl={editingControl}
                    />
            </div>
        </div>
    )
}

export default WallContainer;

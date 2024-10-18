import React, { useState, useEffect } from 'react';
import axios from '../http';
import axiosInstance from '../http';
import PreviewWall from './PreviewWall';

import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import './PreviewModal.css';

const PreviewModal = ({ show, onClose, videos, locations, brokenBricks, setLocations, showId }) => {
    const [draggingVideo, setDraggingVideo] = useState(null);
    const [draggingSrc, setDraggingSrc] = useState(null);
    const [frameNumber, setFrameNumber] = useState(0);
    const [previewFrames, setPreviewFrames] = useState({}); // Store preview frame
    const [frameCount, setFrameCount] = useState(0);

    // Helper function to reduce code repetition
    const resetModal = (status = null) => {
        setDraggingVideo(null);
        setDraggingSrc(null);
    }

    useEffect(() => {
        const fetchPreviewFrames = async () => {
            try {
                const showResponse = await axios.get(`api/shows/${showId}/`);
                setFrameCount(showResponse.data.frame_count);

                videos.forEach(video => {
                    setPreviewFrames(prevFrames => ({
                        ...prevFrames,
                        [video.id]: `${axiosInstance.defaults.baseURL}api/videos/${video.id}/frame/?frame=${frameNumber}` // frame number need to be changed when show management is implemented
                    }));
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchPreviewFrames();

    }, [videos, frameNumber, showId]);

    // Clear upload status + error message on modal close
    useEffect(() => {
        if (!show) {
            resetModal();
        }
    }, [show]);

    // start dragging
    const handleDragStart = (e, video, srcNumber) => {
        e.dataTransfer.setData("text/plain", video.file); // set dragging icon 
        setDraggingVideo(video);
        setDraggingSrc(srcNumber);
    };

    // update video locations when dropped
    const handleDrop = (destNumber) => {
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

                return;
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

            // Reset the dragging state
            resetModal();
        }
    };

    const handleRemove = (brickNumber) => {
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

    if (!show) {
        return null;
    }

    return (
        <Modal className={'preview-modal'}>
            <Button onClick={() => { onClose(); resetModal(); }} className="preview-modal-back-button" label={"X"} />
            <div className='walls-container'>
                <PreviewWall
                    isWest={true}
                    videos={videos}
                    locations={locations}
                    previewFrames={previewFrames}
                    showFrameCount={frameCount}
                    frameNumber={frameNumber}
                    setFrameNumber={setFrameNumber}
                    brokenBricks={brokenBricks}
                    onRemove={handleRemove}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                />
                <PreviewWall
                    isWest={false}
                    videos={videos}
                    locations={locations}
                    showFrameCount={frameCount}
                    frameNumber={frameNumber}
                    previewFrames={previewFrames}
                    setFrameNumber={setFrameNumber}
                    brokenBricks={brokenBricks}
                    onRemove={handleRemove}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                />
            </div>
        </Modal>
    )
}

export default PreviewModal;
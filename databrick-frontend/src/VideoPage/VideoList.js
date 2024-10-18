import React, { useState, useEffect } from 'react';
import axios from '../http';
import VideoUploadModal from './VideoUploadModal';
import VideoPlayerModal from './VideoPlayerModal';
import PreviewModal from './PreviewModal';
import { westWallBricks, eastWallBricks } from '../Constants';

import { Button, DeleteButton } from '../components/Button'
import { Modal } from '../components/Modal';
import './VideoList.css'

// Represents each video 
const VideoItem = ({ video, index, handleSelectVideo, handleOpenVideo, handleDelete, onDragStart, onDragOver, onDragEnd, editingControl = false }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = () => {
        if (!editingControl) return;  // Disable drag if editing is not allowed
        setIsDragging(true);
        onDragStart(video, index);
    };

    const handleDragOver = (e) => {
        if (!editingControl) return;  // Disable drag if editing is not allowed
        e.preventDefault(); // Allow the drop
        onDragOver(index);
    };

    const handleDragEnd = () => {
        if (!editingControl) return;  // Disable drag if editing is not allowed
        setIsDragging(false);
        onDragEnd();
    };

    return (
        <div
            style={{ opacity: isDragging ? 0.5 : 1 }}
            className={`video-list-item ${isDragging ? 'dragging' : ''}`}
            onClick={() => handleSelectVideo(video.id)}
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className='video-list-item-info'>
                {/* Clickable thumbnail wrapper */}
                <div
                    className="video-thumbnail-wrapper"
                    onClick={(event) => {
                        event.stopPropagation(); // Prevent event bubbling
                        handleOpenVideo(event, video);
                    }}
                >
                    {/* Thumbnail Video Element */}
                    <video
                        className="video-list-item-thumbnail"
                        src={video.file}
                        preload="metadata"
                        onLoadedMetadata={(e) => { e.target.currentTime = 0; }}
                    />
                    {/* Play icon overlay */}
                    <div className="play-icon">▶</div>
                </div>
                <p className='video-list-item-info-title'>
                    {video.title}
                </p>
            </div>
            {editingControl && (
                <div className='video-list-item-actions'>
                    <Button onClick={(e) => { e.stopPropagation(); handleDelete(video.id); }} className='delete-button' label={<img src="/VideoPage/delete_icon.png" alt="delete-icon" />} />
                </div>
            )}
        </div>
    );
};

const VideoList = ({ videos, setVideos, locations, setLocations, brokenBricks, showId, handleDragToWalls, editingControl = false }) => {
    const [showVideoUploadModal, setShowVideoUploadModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState(null);
    const [videoToPlay, setVideoToPlay] = useState(null); // To track the selected video for playing
    const [showAllocateModal, setShowAllocateModal] = useState(false);
    const [selectedVideosForAllocation, setSelectedVideosForAllocation] = useState([]);
    const allSelected = selectedVideosForAllocation.length === videos.length;
    const [isRandomUpdated, setIsRandomUpdated] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);

    const handleSelectVideo = (id) => {
        if (selectedVideoId === id) {
            setSelectedVideoId(null); // Deselect if already selected
        } else {
            setSelectedVideoId(id); // Select if not already selected
        }
    };

    const handleOpenVideo = (event, video) => {
        event.stopPropagation(); // Prevent event bubbling to handleSelectVideo
        setVideoToPlay(video); // Set the selected video for playing
    };

    const handleCloseVideo = () => {
        setVideoToPlay(null); // Close video when user finishes watching
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm('Are you sure you want to delete this video? (All allocated bricks will be unassigned)');
        if (!confirmed) return;

        // Link with Backend
        try {
            await axios.delete(`api/videos/${id}/`);
            setVideos(prevVideos => prevVideos.filter(video => video.id !== id));
            setSelectedVideosForAllocation(prevVideos => prevVideos.filter(selectedVideoId => selectedVideoId !== id));

            // Fetch updated locations from the backend
            const response = await axios.get(`api/shows/${showId}/locations/`);
            setLocations(response.data); // Update the locations state with the new data
        } catch (error) {
            console.error("Error deleting video:", error);
        }
    }

    const handleUpload = () => {
        setShowVideoUploadModal(true);
    }

    const handleCloseVideoUploadModal = () => {
        setShowVideoUploadModal(false);
    }

    const handleDragStart = (video, index) => {
        setDraggedIndex(index);
        handleDragToWalls(video);
    };

    const handleDragOver = (index) => {
        if (draggedIndex === null || draggedIndex === index) return;

        const newVideos = [...videos];
        const [movedItem] = newVideos.splice(draggedIndex, 1);
        newVideos.splice(index, 0, movedItem);

        setVideos(newVideos);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handlePreview = () => {
        setShowPreviewModal(true);
    }

    const handleClosePreviewModal = () => {
        setShowPreviewModal(false);
    }

    const handleAllocateSelect = () => {
        setShowAllocateModal(true);
    };

    const handleVideoSelectForAllocation = (videoId) => {
        setSelectedVideosForAllocation(
            selectedVideosForAllocation.includes(videoId)
                ? selectedVideosForAllocation.filter(id => id !== videoId)
                : [...selectedVideosForAllocation, videoId]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedVideosForAllocation(videos.map((video) => video.id));
        } else {
            setSelectedVideosForAllocation([]);
        }
    };

    const handleConfirmAllocation = () => {
        if (selectedVideosForAllocation.length === 0) {
            alert("Please select at least one video to randomly distribute.");
            return;
        } else {
            const confirmed = window.confirm('Are you sure you want to randomly distribute the selected video(s) across unassigned bricks?');
            if (!confirmed) return;
        }

        const allBricks = [...Object.values(eastWallBricks), ...Object.values(westWallBricks)];
        let newDistribution = {};

        // Filter out bricks that already have a video assigned
        const availableBricks = allBricks.filter(brick => {
            const location = locations[parseInt(brick) - 1];
            return (!location || !location.video);
        });
        if (availableBricks.length === 0) {
            // If no bricks available to allocation to, give notice.
            alert("No unassigned bricks available for allocation. Please unassign some videos or clear the show first.")
            return;
        }

        if (selectedVideosForAllocation.length === 1) {
            // If only one video is selected, assign it to all available bricks
            const selectedVideo = videos.find(video => video.id === selectedVideosForAllocation[0]);
            availableBricks.forEach(brick => {
                newDistribution[brick] = selectedVideo.id;
            });
        } else {
            // If multiple videos are selected, shuffle bricks and videos for random distribution
            const shuffledBricks = availableBricks.sort(() => Math.random() - 0.5); // Randomize bricks
            const shuffledVideos = selectedVideosForAllocation
                .map(videoId => videos.find(video => video.id === videoId))
                .sort(() => Math.random() - 0.5); // Randomize selected videos

            shuffledBricks.forEach((brick, index) => {
                // Use modulo operation to loop through shuffled videos
                const videoToAssign = shuffledVideos[index % shuffledVideos.length];
                newDistribution[brick] = videoToAssign.id;
            });
        }

        // Save the wall distribution
        saveWallDistribution({
            brickDistribution: newDistribution
        }).then(() => {
            axios.get(`api/shows/${showId}/locations/`)
                .then(response => {
                    setLocations(response.data);
                    setIsRandomUpdated(true);
                })
                .catch(error => {
                    console.error("Error fetching updated distribution:", error);
                });
        }).catch(error => {
            console.error("Error saving wall distribution:", error);
        });

        // Clear selected videos after allocation
        setSelectedVideosForAllocation([]);
    };

    const saveWallDistribution = async (wallData) => {
        try {
            console.log(wallData);
            const formData = new FormData();
            formData.append('brickDistribution', JSON.stringify(wallData.brickDistribution));

            const response = await axios.post(`api/shows/${showId}/save_wall_distribution/`, wallData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            console.log('Wall distribution saved:', response.data);
        } catch (error) {
            console.error('Error saving wall distribution:', error);
        }
    };

    useEffect(() => {
        if (isRandomUpdated) {
            // setShowPreviewModal(true);
            setShowAllocateModal(false);
            // Reset the flag after updating modals
            setIsRandomUpdated(false);
        }
    }, [isRandomUpdated]);

    const handleClearAllLocations = () => {
        if (window.confirm("Are you sure you want to clear all locations?")) {
            axios.post(`api/shows/${showId}/clear_locations/`)
                .then(response => {
                    // TODO: Update only the necessary locations here, as opposed to all of them!
                    axios.get(`api/shows/${showId}/locations/`)
                        .then(locationResponse => {
                            setLocations(locationResponse.data);
                        })
                        .catch(error => console.error('Error fetching locations:', error));
                    // setLocations(response.data.data);
                    alert(response.data.message);
                })
                .catch(error => {
                    console.error("Error clearing locations:", error);
                });
        }
    };

    return (
        <div className='video-list'>
            <h1 className='video-list-title'>Videos</h1>
            {videos && videos.length ? (
                <div className='video-list-content'>
                    {videos.map((video, index) => (
                        <VideoItem
                            key={video.id.toString()}
                            video={video}
                            index={index}
                            handleSelectVideo={handleSelectVideo}
                            handleOpenVideo={handleOpenVideo}
                            handleDelete={handleDelete}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            editingControl={editingControl}
                        />
                    ))}
                </div>
            ) : (
                <div className='video-list-content'>No videos available</div>
            )}
            {editingControl && (
                <div className='video-list-buttons'>
                    <Button className='upload-button' onClick={handleUpload} label={"Upload Videos"} />
                    <Button className='preview-button' onClick={handlePreview} label={"Preview Show"} />
                    <Button className='allocate-button' onClick={handleAllocateSelect} label={"Random Allocation"} />
                    <DeleteButton className='clear-button' onClick={handleClearAllLocations} label={"Clear Show"} />
                </div>
            )}
            <VideoUploadModal
                show={showVideoUploadModal}
                onClose={handleCloseVideoUploadModal}
                videos={videos}
                setVideos={setVideos}
                showId={showId}
            />
            <VideoPlayerModal
                video={videoToPlay}
                onClose={handleCloseVideo}
            />
            <PreviewModal
                show={showPreviewModal}
                onClose={handleClosePreviewModal}
                videos={videos}
                locations={locations}
                brokenBricks={brokenBricks}
                setLocations={setLocations}
                showId={showId}
            />
            {showAllocateModal && (
                <Modal className={"allocate-modal"}>
                    <h2 className='modal-title'>Please select videos to allocate</h2>
                    <Button
                        className="allocate-close-button"
                        onClick={() => setShowAllocateModal(false)}
                        label={"X"}
                    />
                    <div className="allocate-controls">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={handleSelectAll}
                        />
                        <label>Select All</label>
                    </div>
                    <div className="allocate-video-list">
                        {videos.map((video) => (
                            <div key={video.id}>
                                <input
                                    type="checkbox"
                                    checked={selectedVideosForAllocation.includes(video.id)}
                                    onChange={() => handleVideoSelectForAllocation(video.id)}
                                />
                                <label>{video.title}</label>
                            </div>
                        ))}
                    </div>
                    <Button className="allocate-confirm-button"
                        onClick={handleConfirmAllocation}
                        label={"Confirm"}
                    />
                </Modal>
            )}

        </div>
    );
}

export default VideoList;
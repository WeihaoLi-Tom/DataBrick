import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../http';
import { Tabs, Tab } from '@mui/material';
import './VideoPage.css';
import VideoList from './VideoList';
import StatusList from '../BrickPage/StatusList';
import WallContainer from './WallContainer';
import { AccessControlWrapper } from '../components/NoAccess';

const VideoPage = () => {
    const { showId } = useParams();
    const [videoList, setVideoList] = useState([]);
    const [videoLocations, setVideoLocations] = useState([]);
    const [brokenBricks, setBrokenBricks] = useState([]);
    const [statusList, setStatusList] = useState([]);
    const [draggingVideo, setDraggingVideo] = useState(null);
    const [selectedTab, setSelectedTab] = useState(0); // 0: VideoList, 1: StatusList
    const [viewingStatus, setViewingStatus] = useState(null);
    const [showTitle, setShowTitle] = useState('No title found')
    const [showStatus, setShowStatus] = useState('');
    const [assignedArtistId, setArtist] = useState('');

    const role = localStorage.getItem('userRole');
    const currentUserId = role === 'artist' ? localStorage.getItem('userId') : null;

    useEffect(() => {
        Promise.all([
            axios.get(`api/shows/${showId}/videos/`),
            axios.get(`api/shows/${showId}/locations/`),
            axios.get(`api/shows/${showId}/`),
            axios.get(`api/bricks/`),
            axios.get('api/statuses/')
        ])
            .then(([videoResponse, locationResponse, showResponse, brickResponse, statusResponse]) => {
                const videos = videoResponse.data;
                const locations = locationResponse.data;
                const show = showResponse.data;
                const bricks = brickResponse.data;
                const statuses = statusResponse.data;

                setVideoList(videos);
                setVideoLocations(locations);
                setShowTitle(show.title)
                setShowStatus(show.status);
                setBrokenBricks(bricks.length ? bricks.filter(brick => brick.statuses.length) : []);
                setStatusList(statuses);
                setArtist(show.artist);
            })
            .catch(error => console.error('Error fetching data:', error));
    }, [showId]);

    const resetDragging = (status = null) => {
        if (!editingControl) return;  // Disable drag if editing is not allowed
        setDraggingVideo(null);
    }

    // start dragging
    const handleDragStart = (video) => {
        if (!editingControl) return;  // Disable drag if editing is not allowed
        setDraggingVideo(video);
    };

    // update video locations when dropped
    const handleDrop = (destNumber) => {
        if (!editingControl) return;  // Disable dropping if editing is not allowed

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
                resetDragging();
                return;
            }

            const destBrick = videoLocations.find(location => location.location_number === destNumber)

            if (!destBrick.video) {
                // Update the destination location with the dragged video
                setVideoLocations(prevLocations =>
                    prevLocations.map(location =>
                        location.location_number === destNumber
                            ? { ...location, video: draggingVideo.id } // Assign video to new location
                            : location
                    )
                );

                // Update the new location on the backend
                updateLocationOnBackend(destNumber, { video: draggingVideo.id });
            }

            resetDragging();
            return;
        }
    };

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };

    const handleViewStatusBrick = (status) => {
        setViewingStatus(status);
    }

    // Function to determine if editing show files should be locked.
    function editLocked(show_status) {
        // Never lock out admin
        if (role === 'admin') return false;
        // Lock if show is approved or pending approval
        if (show_status === 'approved' || show_status === 'pending_approval') return true;
        // Otherwise lock if no userAccess 
        return !userAccess()
    }
    const editingControl = !editLocked(showStatus);

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
            <div className="video-page-container">
                {/* Show title */}
                <div className="show-title">{"Show title: " + showTitle}</div>
                
                <div className='video-page'>
                    <WallContainer
                        videos={videoList}
                        locations={videoLocations}
                        brokenBricks={brokenBricks}
                        setLocations={setVideoLocations}
                        showId={showId}
                        handleDropFromVideoList={handleDrop}
                        viewingStatus={viewingStatus}
                        editingControl={editingControl}
                    />
                    <div className='list-container'>
                        <Tabs
                            className='list-container-tab'
                            value={selectedTab}
                            onChange={handleTabChange}
                            variant="fullWidth"
                        >
                            <Tab label="Video List" />
                            <Tab label="Brick Status" />
                        </Tabs>

                        {selectedTab === 0 ? (
                            <VideoList
                                videos={videoList}
                                setVideos={setVideoList}
                                locations={videoLocations}
                                setLocations={setVideoLocations}
                                brokenBricks={brokenBricks}
                                showId={showId}
                                handleDragToWalls={handleDragStart}
                                editingControl={editingControl}
                            />
                        ) : (
                            <StatusList
                            bricks={brokenBricks}
                            setBricks={null}
                            statuses={statusList} 
                            setStatuses={null}
                            handleViewStatusBrick={handleViewStatusBrick}
                            // Disable editor controls
                            editingControl={false}
                        />
                        )}
                    </div>
                </div>
            </div>
        </AccessControlWrapper>
    );
};

export default VideoPage;

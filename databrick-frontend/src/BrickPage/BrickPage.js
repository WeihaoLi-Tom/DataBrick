import React, { useState, useEffect } from 'react';
import axios from '../http';
import './BrickPage.css';
import BrickWall from './BrickWall';
import StatusList from './StatusList';
import { AccessControlWrapper } from '../components/NoAccess';

const BrickPage = () => {
    const [bricks, setBricks] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [viewingStatus, setViewingStatus] = useState(null);
    const role = localStorage.getItem('userRole');

    useEffect(() => {
        // Fetch video data from Django backend
        Promise.all([
            axios.get('api/bricks/'),
            axios.get('api/statuses/')
        ])
        .then(([brickResponse, statusResponse]) => {
            const bricks = brickResponse.data;
            const statuses = statusResponse.data;

            setBricks(bricks);
            setStatuses(statuses);
        })
        .catch(error => console.error('Error fetching data:', error));
    }, []);

    useEffect(() => {
        if (viewingStatus && !statuses.some(status => status.id === viewingStatus.id))
        {
            setViewingStatus(null);
        }
    }, [statuses, viewingStatus]);

    const handleViewStatusBrick = (status) => {
        setViewingStatus(status);
    }

    // Function to determine if editing brick management should be locked
    function editLocked() {
        // Only allow admin access
        return !(role === 'admin');
    }
    const editingControl = !editLocked();

    // Function to determine if user should have access
    function userAccess() {
        // Only allow admin access
        return (role === 'admin');
    }

    return (
        // User access control - only admins may access this page
        <AccessControlWrapper hasAccess={userAccess()}>
            <div className='brick-page'>
                <div className='walls-container'>
                    { [true, false].map(isWest => (
                        <BrickWall
                            isWest={isWest}
                            bricks={bricks}
                            setBricks={setBricks}
                            statuses={statuses}
                            setStatuses={setStatuses}
                            viewingStatus={viewingStatus}
                            editingControl={editingControl}
                        />
                    )) }
                </div>
                <div className='list-container'>
                    <StatusList 
                        bricks={bricks} 
                        setBricks={setBricks} 
                        statuses={statuses} 
                        setStatuses={setStatuses} 
                        handleViewStatusBrick={handleViewStatusBrick} 
                        editingControl={editingControl}
                    />
                </div>
            </div>
        </AccessControlWrapper>
    );
}

export default BrickPage;
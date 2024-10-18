import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../http';
import SetStatusModal from './SetStatusModal';

import {Button, DeleteButton} from '../components/Button';
import './ShowManagementPage.css';
import { Input } from '../components/Input';
import { AccessControlWrapper } from '../components/NoAccess';

function ShowManagementPage() {
    const [showName, setShowName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [shows, setShows] = useState([]);
    const [message, setMessage] = useState('');
    const [frameCount, setFrameCount] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredShows, setFilteredShows] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('All');
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState('');
    const [showToSet, setShowToSet] = useState(null);

    useEffect(() => {

        const role = localStorage.getItem('userRole');

        setUserRole(role);

        const fetchShows = async () => {
            try {
                const userId = localStorage.getItem('userId');
                // Display a different message if not signed in
                if (role === null || userId === null) {
                    setMessage('Not logged in.')
                    return
                }

                let response;
                if (role === 'admin') {
                    response = await axios.get(`api/shows/`);
                } else if (role === 'artist') {
                    response = await axios.get(`api/shows/artist/${userId}/`);
                }
                const showData = response.data;
                setShows(showData);
                setFilteredShows(showData);
            } catch (error) {
                console.log(error)
                setMessage('Failed to fetch show.');
            }
        };


        const fetchStatuses = async () => {
            try {
                const response = await axios.get(`api/shows/statuses/`);
                const statusData = response.data

                // Convert the array of status objects into a dictionary
                const statusDict = {};
                statusData.forEach(status => {
                    statusDict[status.value] = status.display;
                });
                setStatuses(statusDict);
            } catch (error) {
                setMessage('Failed to fetch statuses.');
            }
        };

        fetchShows();
        fetchStatuses();
    }, []);

    
    const handleAssignArtist = () => {
        navigate('/assign-artist');
    };

    const handleCreateShow = async () => {
        const today = new Date().toISOString().split('T')[0];

        setMessage('');

        if (showName.trim() === '' || startDate === '' || endDate === '' || !image) {
            setMessage('Show name, date range, and image cannot be empty.');
            return;
        }

        if (startDate <= today || endDate <= today) {
            setMessage('Show dates must be after today.');
            return;
        }

        if (startDate > endDate) {
            setMessage('End date cannot be before start date.');
            return;
        }

        // Check remainder to ensure not a decimal value
        if (frameCount < 1 || (frameCount % 1) !== 0) {
            setMessage('Frame count must be a positive integer.');
            return
        }

        const formData = new FormData();
        formData.append('title', showName);
        formData.append('start_date', startDate);
        formData.append('end_date', endDate);
        formData.append('description', description);
        formData.append('cover_image', image);
        formData.append('frame_count', frameCount);

        try {
            const response = await axios.post('api/shows/', formData);
            const newShow = response.data;

            const updatedShows = [...shows, newShow];
            setShows(updatedShows);
            setFilteredShows(updatedShows);

            setShowName('');
            setStartDate('');
            setEndDate('');
            setFrameCount('');
            setDescription('');
            setImage(null);
            setMessage('Show created successfully!');

            handleFindShows(selectedStatus, searchTerm);
        } catch (error) {
            console.error('Error:', error);
            setMessage('Failed to create show.');
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        setImage(file);
    };

    const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleCheckFilesClick = (showId) => {
        navigate(`/showdetails/${showId}`);
    };

    const handleFindShows = useCallback((statusParam, searchTermParam) => {
        const statusToUse = statusParam !== undefined ? statusParam : selectedStatus;

        let filtered = shows;

        if (searchTerm.trim() !== '') {
            filtered = filtered.filter(show =>
                show.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusToUse !== 'All') {
            filtered = filtered.filter(show => show.status === statusToUse);
        }

        setFilteredShows(filtered);
    }, [searchTerm, selectedStatus, shows]);

    useEffect(() => {
        handleFindShows(selectedStatus, searchTerm);
    }, [shows,selectedStatus, searchTerm, handleFindShows]);

    const handleDeleteShow = async (id) => {
        const confirmed = window.confirm('Are you sure you want to delete this show?');
        if (!confirmed) return;

        try {
            await axios.delete(`api/shows/${id}/`);

            const updatedShows = shows.filter(show => show.id !== id);
            setShows(updatedShows);
            setFilteredShows(updatedShows);
            setMessage('Show deleted successfully!');
            handleFindShows();
        } catch (error) {
            console.error('Error:', error);
            setMessage('Failed to delete show.');
        }
    };

    const handleShowClick = (show) => {
        if(userRole === 'artist' && show.status === 'approved'){
            alert('Sorry, artists cannot edit shows that have been approved');
        } else if(userRole === 'artist' && show.status === 'pending_approval'){
            alert('Sorry, artists cannot edit shows that are waiting for approval');
        } else{
            navigate(`/video-page/${show.id}`);
        }
    };

    const handleCloseStatusModal = (updatedShow) => {
        setShowToSet(null);

        if (updatedShow) {
            const updatedShows = shows.map((show) =>
                show.id === updatedShow.id ? updatedShow : show
            );
            setShows(updatedShows);
            setFilteredShows(updatedShows);
            handleFindShows();
        }
    };
    const handleCompleteDesign = async (showId) => {
        try {
            // TODO : send email to admin
            const response = await axios.patch(`api/shows/${showId}/`, {
                status: 'pending_approval',
            });

            if (response.status === 200) {
                setShows(prevShows =>
                    prevShows.map(show => {
                        if (show.id === showId) {
                            return {
                                ...show,
                                status: 'pending_approval'
                            };
                        }
                        return show;
                    })
                );

                setFilteredShows(prevShows =>
                    prevShows.map(show => {
                        if (show.id === showId) {
                            return {
                                ...show,
                                status: 'pending_approval'
                            };
                        }
                        return show;
                    })
                );
            } else {
                setMessage('Error completing the design.');
            }
        } catch (error) {
            setMessage('Failed to complete the design.');
        }
    };
    const handleApproveShow = async (showId) => {
        try {
            const response = await axios.patch(`api/shows/${showId}/`, {
                status: 'approved',
            });

            if (response.status === 200) {
                setShows(prevShows =>
                    prevShows.map(show => {
                        if (show.id === showId) {
                            return {
                                ...show,
                                status: 'approved'
                            };
                        }
                        return show;
                    })
                );

                setFilteredShows(prevShows =>
                    prevShows.map(show => {
                        if (show.id === showId) {
                            return {
                                ...show,
                                status: 'approved'
                            };
                        }
                        return show;
                    })
                );
            } else {
                setMessage('Error approve the show.');
            }
        } catch (error) {
            setMessage('Failed to approve the show.');
        }
    };
    const handleDenyShow = async (showId) => {
        try {
            // TODO: send email to artist
            const response = await axios.patch(`api/shows/${showId}/`, {
                status: 'in_design',
            });

            if (response.status === 200) {
                setShows(prevShows =>
                    prevShows.map(show => {
                        if (show.id === showId) {
                            return {
                                ...show,
                                status: 'in_design'
                            };
                        }
                        return show;
                    })
                );

                setFilteredShows(prevShows =>
                    prevShows.map(show => {
                        if (show.id === showId) {
                            return {
                                ...show,
                                status: 'in_design'
                            };
                        }
                        return show;
                    })
                );
            } else {
                setMessage('Error deny the show.');
            }
        } catch (error) {
            setMessage('Failed to deny the show.');
        }
    };

    // Function to determine if user should have access
    function adminAccess() {
        // Only allow admin access
        return (userRole === 'admin');
    }

    return (
        // <h1> hi</h1>
        <div className="show-management-container">
            <h1>{adminAccess() ? "Show Management" : "My Shows"}</h1>

            <AccessControlWrapper hasAccess={adminAccess()} blank={true} >
                <div className="show-form">
                    {/* Show Name */}
                    <div className="form-group">
                        <label className="form-label">Enter Show Name:</label>
                        <Input
                            type="text"
                            placeholder="Enter Show Name"
                            value={showName}
                            onChange={(e) => setShowName(e.target.value)}
                            className="form-input"
                        />
                    </div>

                    {/* Start Date */}
                    <div className="form-group">
                        <label className="form-label">Enter Start Date:</label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="form-input"
                        />
                    </div>

                    {/* End Date */}
                    <div className="form-group">
                        <label className="form-label">Enter End Date:</label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="form-input"
                        />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label className="form-label">Enter Description:</label>
                        <Input
                            type="text"
                            placeholder="Enter Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="form-input"
                        />
                    </div>
                    
                    {/* Frame Count */}
                    <div className="form-group">
                        <label className="form-label">Enter Frame Count:</label>
                        <Input
                            type="number"
                            placeholder="Enter Frame Count"
                            value={frameCount}
                            onChange={(e) => setFrameCount(e.target.value)}
                            className="form-input"
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="form-group">
                        <label className="form-label">Cover Image:</label>
                        <Input type="file" onChange={handleImageUpload} accept="image/*"/>
                    </div>

                    <Button onClick={handleCreateShow} label={"Create Show"}/>
                </div>
            </AccessControlWrapper>

            <p className="message">{message}</p>

            <div className="search-bar">
                <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <Input
                        type="text"
                        placeholder="Search for shows"
                        value={searchTerm}
                        onChange={handleSearchInputChange}
                        className="search-input"
                    />
                </div>
                <Button className="search-button" onClick={()=>handleFindShows(undefined, searchTerm)} label={"Find Shows"}/>

                {userRole === 'admin' && (
                    <Button className="assign-artist-button" onClick={handleAssignArtist} label={"Assign Artist"}/>
                )}
            </div>

            <h2>Shows List</h2>
            <div className="status-filter">
                <AccessControlWrapper hasAccess={adminAccess()} blank={true}>
                    <label htmlFor="status-filter">Filter by Status: </label>
                    <select
                        id="status-filter"
                        value={selectedStatus}
                        onChange={(e) => {
                            const newStatus = e.target.value;
                            setSelectedStatus(newStatus)
                            handleFindShows(newStatus, searchTerm);

                        }}
                    >
                        <option value="All">All</option>
                        {Object.entries(statuses).map(([value, display]) => (
                            <option key={value} value={value}>{display}</option>
                        ))}
                    </select>
                </AccessControlWrapper>
            </div>
            <div className="show-list">
                {filteredShows.length > 0 ? (
                    filteredShows.map((show) => (
                        <div
                            key={show.id}
                            className="show-card"
                            onClick={() => handleShowClick(show)}
                            style={{ cursor: 'pointer' }}
                        >
                            <img
                                src={show.cover_image}
                                alt={show.title}
                                className="show-image"
                            />
                            <div className="show-details">
                                <h3>{show.title}</h3>
                                <p>
                                    {new Date(show.start_date).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric'
                                    })} - {
                                        new Date(show.end_date).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                                <p>{show.frame_count} frames</p>
                                <p>Status: {statuses[show.status] || 'Deprecated Status (' + show.status + ')' || 'Deprecated Status'}</p>
                                <p>Assigned Artist: {show.artist_username ? show.artist_username : 'Unassigned'}</p>

                            </div>
                            {(userRole === 'admin' || (userRole === 'artist' && show.status !== 'approved')) && (
                                <>
                                    {(userRole === 'artist' && show.status === 'in_design') && (
                                        <>
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const confirmAction = window.confirm('Are you sure you want to submit this design for approval?\nYou will not be able to make any further changes.');
                                                    if (confirmAction) {
                                                        handleCompleteDesign(show.id);
                                                    }
                                                }}
                                                label={"Complete Design"}
                                            />
                                            <br />
                                            <br />
                                        </>
                                    )
                                    }

                                    {(userRole === 'admin' && show.status === 'pending_approval') && (
                                        <>
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const confirmAction = window.confirm('Are you sure you want to approve this show?\nArtists will not be able to work on it until it is reassigned to them.');
                                                    if (confirmAction) {
                                                        handleApproveShow(show.id);
                                                    }
                                                }}
                                                label={"Approve"}
                                            />&nbsp;
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const confirmAction = window.confirm('Are you sure wish to place this show back into the designing phase?\nEdit access will be restored to assigned artist.');
                                                    if (confirmAction) {
                                                        handleDenyShow(show.id);
                                                    }
                                                }}
                                                label={"Deny"}
                                            />
                                            <br />
                                            <br />
                                        </>
                                    )
                                    }
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCheckFilesClick(show.id);
                                        }}
                                        className="check-files-button"
                                        label={"Check Files"}
                                    />
                                    <br />
                                </>
                            )}
                            {/* {(userRole === 'admin' || userRole === 'artist') && (   // Don't delete this block of code, it is useful while testing
                                <>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSetStatusClick(show);
                                        }}
                                        className="set-status-button"
                                        label={"Set Status"}
                                    />
                                </>
                            )} */}
                            <AccessControlWrapper hasAccess={adminAccess()} blank={true}>
                                <DeleteButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteShow(show.id);
                                    }}
                                    className="show-delete-button"
                                    label={"Delete"}
                                />
                            </AccessControlWrapper>
                        </div>
                    ))
                ) : (
                    <p>No shows found.</p>
                )}
            </div>
            {showToSet && (
                <SetStatusModal
                    show={showToSet}
                    onClose={handleCloseStatusModal}
                    statuses={statuses}
                />
            )}
        </div>
    );
}

export default ShowManagementPage;

import React, { useState, useEffect } from 'react';
import axios from '../http';
import { Button } from '../components/Button';
import { AccessControlWrapper } from '../components/NoAccess';
import './ArtistAssignPage.css';

function ArtistAssignPage() {
    const [shows, setShows] = useState([]);
    const [artists, setArtists] = useState([]);
    const [selectedArtists, setSelectedArtists] = useState({});
    const [message, setMessage] = useState('');
    const role = localStorage.getItem('userRole');


    // Fetch shows
    useEffect(() => {
        const fetchShows = async () => {
            try {
                const response = await axios.get('api/shows/');
                const showData = response.data;
                setShows(showData);
            } catch (error) {
                setMessage('Failed to fetch shows.');
            }
        };
        fetchShows();
    }, []);

    // Fetch artists (users with role 'artist')
    useEffect(() => {
        const fetchArtists = async () => {
            try {
                const response = await axios.get('api/artists/');
                const artistData = response.data;
                setArtists(artistData);
            } catch (error) {
                setMessage('Failed to fetch artists.');
            }
        };
        fetchArtists();
    }, []);

    // Handle artist selection change
    const handleArtistChange = (showId, artistId) => {
        setSelectedArtists(prevState => ({
            ...prevState,
            [showId]: artistId
        }));
    };

    // Assign artist to show
    const handleAssignArtist = async (showId) => {
        const artistId = selectedArtists[showId];
        if (!artistId) {
            setMessage('Please select an artist.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('artist_id', artistId);

            const response = await axios.post(`api/shows/${showId}/assign-artist/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (response.status === 200) {
                setMessage('Artist assigned successfully!');

                // Update the assigned artist in shows state
                setShows(prevShows =>
                    prevShows.map(show =>
                        show.id === showId ? { ...show, artist_username: artists.find(artist => artist.id === Number(artistId)).username } : show
                    )
                );
            } else {
                setMessage('Error assigning artist.');
            }
        } catch (error) {
            setMessage('Failed to assign artist.');
        }
    };

    // Function to determine if user should have access
    function userAccess() {
        // Only allow admin access
        return (role === 'admin');
    }

    return (
        // User access control - only admins may access this page */}
        <AccessControlWrapper hasAccess={userAccess()}>
            <div className="container">
                <h1>Assign Artist to Shows</h1>
                <div className="show-list">
                    {shows.length > 0 ? (
                        shows.map((show) => (
                            <div key={show.id} className="show-card">
                                <h3>{show.title}</h3>
                                <p>
                                    {new Date(show.start_date).toLocaleDateString()} - {new Date(show.end_date).toLocaleDateString()}
                                </p>
                                <p>{show.frame_count} frames</p>


                                <p>Assigned Artist: {show.artist_username ? show.artist_username : 'Unassigned'}</p>

                                {/* Artist selection dropdown */}
                                <select
                                    value={selectedArtists[show.id] || ''}
                                    onChange={(e) => handleArtistChange(show.id, e.target.value)}
                                >
                                    <option value="">Select an artist</option>
                                    {artists.map((artist) => (
                                        <option key={artist.id} value={artist.id}>
                                            {artist.username}
                                        </option>
                                    ))}
                                </select>


                                <Button
                                    className="assign-button"
                                    onClick={() => handleAssignArtist(show.id)}
                                    disabled={!selectedArtists[show.id]}
                                    label={"Assign Artist"}
                                />
                            </div>
                        ))
                    ) : (
                        <p>No shows found.</p>
                    )}
                </div>

                <p className="message">{message}</p>
            </div>
        </AccessControlWrapper>
    );
}

export default ArtistAssignPage;

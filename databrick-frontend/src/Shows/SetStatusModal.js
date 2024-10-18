import React, { useState, useEffect } from 'react';
import axios from '../http';
import { Button } from '../components/Button';
import './SetStatusModal.css';

function SetStatusModal({ show, onClose, statuses }) {

    const [status, setStatus] = useState(show.status || 'unassigned');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setStatus(show.status); // Update status based on the show prop
    }, [show]);

    const handleStatusChange = (e) => {
        setStatus(e.target.value);
    };

    const handleConfirmSetStatus = async () => {
        setLoading(true);
        setError('');

        try {
            // Send a PUT request to update the show's status
            const response = await axios.patch(`api/shows/${show.id}/`, {
                status: status,
            });

            if (response.status === 200) {
                // Successfully updated, call parent's onClose and pass the updated show
                onClose(response.data);
            } else {
                setError('Failed to update status.');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred while updating status.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='set-status-modal'>
            <div className='set-status-modal-content'>
                <h1>Set Status</h1>
                <button onClick={() => onClose(null)} className='back-button'>×</button>

                {error && <p className="error-message">{error}</p>} {/* Display error messages */}

                <div className="status-options">
                    {Object.entries(statuses).map(([value, display]) => (
                        <label key={value}>
                            <input
                                type='radio'
                                name='status'
                                value={value}
                                checked={status === value}
                                onChange={handleStatusChange}
                            />
                            {display} {/* Display the human-readable status */}
                        </label>
                    ))}
                </div>
                <Button onClick={handleConfirmSetStatus} disabled={loading}>
                    label={loading ? 'Updating...' : 'Confirm'}
                </Button>
            </div>
        </div>
    );
}

export default SetStatusModal;
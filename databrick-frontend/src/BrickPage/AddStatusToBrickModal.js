import React, { useEffect, useState } from 'react';
import axios from '../http';

import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import './AddStatusToBrickModal.css';

// Represents each status 
const StatusItem = ({ status, selectedStatus, handleSelectStatus }) => {
    const isSelected = selectedStatus ? selectedStatus.id === status.id : false;

    return (
        <div
            className={`brick-status-item ${isSelected ? 'selected' : ''}`}
            onClick={() => handleSelectStatus(status.id)}
        >
            <div className='brick-status-item-info'>
                <p
                    className='brick-status-item-info-title'
                >
                    {status.name}
                </p>
            </div>
        </div>
    );
};

const AddStatusToBrickModal = ({ show, onClose, brick, statuses, setBricks }) => {
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [addResult, setAddResult] = useState(null);
    const [availableStatus, setAvailableStatus] = useState(statuses.filter(status => !brick.statuses.some(existedStatus => existedStatus.id === status.id)));

    const handleSelectStatus = (id) => {
        if (selectedStatus && selectedStatus.id === id) {
            setSelectedStatus(null);
        } else {
            setSelectedStatus(availableStatus.find(status => status.id === id));
        }
    };

    const resetModal = () => {
        setSelectedStatus(null);
        setAddResult(null);
    }

    // Clear upload status + error message on modal close
    useEffect(() => {
        if (!show) {
            resetModal();
        }
    }, [show]);

    if (!show) {
        return null;
    }

    const handleAddNewStatus = async () => {
        if (selectedStatus !== "") {

            // Link with backend
            const formData = new FormData();
            formData.append('id', brick.id);
            formData.append('status_id', selectedStatus.id);
            formData.append('action_type', 'add');

            try {
                // Upload status to Django backend
                const response = await axios.patch(`api/bricks/${brick.id}/modify-status/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                });
                const updatedBrick = response.data;

                setBricks(prevBricks => prevBricks.map(b =>
                    b.id === updatedBrick.id ? updatedBrick : b
                ));
                setAvailableStatus(availableStatus.filter(status => status.id !== selectedStatus.id));
                setAddResult("Status added successfully!");
                setSelectedStatus(null);
            } catch (error) {
                console.error("Error adding status:", error);
                setAddResult("Failed to add status. Please try again.");
            }
        } else {
            setAddResult("Status name cannot be empty");
        }
    };

    return (
        <Modal className='add-status-brick-modal'>
                <h1>Please select a status to add</h1>
                {availableStatus.length ? (
                    <ul className='modal-status-list'>
                        {availableStatus.map(status => (
                            <StatusItem
                                key={status.id}
                                status={status}
                                selectedStatus={selectedStatus}
                                handleSelectStatus={handleSelectStatus} />
                        ))}
                    </ul>
                ) : (
                    <p>No statuses available for this brick.</p>
                )}
                <div className='add-status-brick-modal-buttons'>
                    <Button className='add-status-brick-modal-button' onClick={handleAddNewStatus} disabled={!selectedStatus} label={"Add"}/>
                    <Button onClick={() => { onClose(); resetModal(); }} label={"Cancel"}/>
                </div>
                {addResult && <p className='add-status-brick-feedback'>{addResult}</p>}
        </Modal>
    );
}

export default AddStatusToBrickModal;
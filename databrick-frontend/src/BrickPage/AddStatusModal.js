import React, { useEffect, useState } from 'react';
import axios from '../http';

import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import './AddStatusModal.css';

const AddStatusModal = ({ show, onClose, statuses, setStatuses }) => {
    const [newStatusName, setNewStatusName] = useState("");
    const [addResult, setAddResult] = useState(null);

    const resetModal = () => {
        setNewStatusName("");
        setAddResult("");
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
        if (newStatusName !== "") {

            if (statuses) {
                // Detect same name status
                const sameNameStatus = statuses.some(status => status.name === newStatusName);
                if (sameNameStatus) {
                    setAddResult(`Status '${newStatusName}' already exists!`);
                    return;
                }
            }

            // Link with backend
            const formData = new FormData();
            formData.append('name', newStatusName);

            try {
                // Upload status to Django backend
                const response = await axios.post('api/statuses/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                });

                // Add the status to the status list
                setStatuses(prevStatuses => [
                    ...prevStatuses,
                    response.data, // Assuming response contains status details
                ]);
                setAddResult("Status added successfully!");
                setNewStatusName("");
            } catch (error) {
                console.error("Error adding status:", error);
                setAddResult("Failed to add status. Please try again.");
            }
        } else {
            setAddResult("Status name cannot be empty");
        }
    };

    return (
        <Modal className='add-status-modal'>
            <h1>Add New Status</h1>
            <input
                type='text'
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder='Enter status name'
            />
            {addResult ? <p className='add-status-feedback'>{addResult}</p> : <p className='add-status-feedback'/>}
            <div className='add-status-modal-buttons'>
                <Button onClick={handleAddNewStatus} label={"Add"} />
                <Button onClick={() => { onClose(); resetModal(); }} label={"Cancel"} />
            </div>
        </Modal>
    );
}

export default AddStatusModal;
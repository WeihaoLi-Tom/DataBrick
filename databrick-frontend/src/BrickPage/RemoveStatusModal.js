import React, { useEffect, useState } from 'react';
import axios from '../http';

import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import './RemoveStatusModal.css';

const RemoveStatusModal = ({ show, onClose, selectedStatus, setSelectedStatus, setStatuses, setBricks }) => {
    const [removeResult, setRemoveResult] = useState(null);

    const resetModal = () => {
        setRemoveResult("");
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

    const handleRemoveStatus = async () => {

        try {
            // Upload status to Django backend
            await axios.delete(`api/statuses/${selectedStatus.id}/`);
            setStatuses(prevStatuses => prevStatuses.filter(status => status.id !== selectedStatus.id));

            // Update bricks to no longer display status as assigned
            setBricks(prevBricks => {
                return prevBricks.map(brick => {
                    // Remove the status from the brick's statuses
                    return {
                        ...brick,
                        statuses: brick.statuses.filter(status => status.id !== selectedStatus.id)
                    };
                });
            });

            setRemoveResult("Status deleted successfully!");
            setSelectedStatus(null);
        } catch (error) {
            console.error("Error deleting status:", error);
            setRemoveResult("Failed to delete status. Please try again.");
        }
    };

    return (
        <Modal className='remove-status-modal'>
            {removeResult ?
                (<div>
                    <p className='remove-status-feedback'>{removeResult}</p>
                    <Button className='close-button' onClick={() => { onClose(); resetModal(); }} label={"Close"}/>
                </div>) :
                (<div>
                    <h1>{`Confirm delete status "${selectedStatus.name}"?`}</h1>
                    <p>(All related status history traces will also be removed)</p>
                    <div className='remove-status-modal-buttons'>
                        <Button onClick={handleRemoveStatus} label={"Yes"}/>
                        <Button onClick={() => { onClose(); resetModal(); }} label={"No"}/>
                    </div>
                </div>)}
        </Modal>
    );
}

export default RemoveStatusModal;
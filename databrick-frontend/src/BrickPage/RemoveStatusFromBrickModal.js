import React, { useEffect, useState } from 'react';
import axios from '../http';

import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import './RemoveStatusFromBrickModal.css';

const RemoveStatusFromBrickModal = ({ show, onClose, selectedStatus, brick, setBricks }) => {
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
        const formData = new FormData();
        formData.append('id', brick.id);
        formData.append('status_id', selectedStatus.id);
        formData.append('action_type', 'remove');

        try {
            const response = await axios.patch(`api/bricks/${brick.id}/modify-status/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            const updatedBrick = response.data;

            setBricks(prevBricks => prevBricks.map(b =>
                b.id === updatedBrick.id ? updatedBrick : b
            ));
            setRemoveResult("Status removed successfully!");
        } catch (error) {
            console.error("Error removing status:", error);
            setRemoveResult("Failed to remove status. Please try again.");
        }
    };

    return (
        <Modal className='remove-status-brick-modal'>
                {removeResult ? 
                    (<div>
                        <p className='remove-status-brick-feedback'>{removeResult}</p> 
                        <div className='remove-status-brick-modal-buttons'>
                            <Button onClick={() => { onClose(); resetModal(); }} label={"Close"}/>
                        </div>
                    </div>) : 
                    (<div>
                        <h1>{`Confirm remove status "${selectedStatus.name}" from Brick ${brick.id}?`}</h1>
                        <div className='remove-status-brick-modal-buttons'>
                            <Button onClick={handleRemoveStatus} label={"Yes"}/>
                            <Button onClick={() => { onClose(); resetModal(); }} label={"No"}/>
                        </div>
                    </div>)}
        </Modal>
    );
}

export default RemoveStatusFromBrickModal;
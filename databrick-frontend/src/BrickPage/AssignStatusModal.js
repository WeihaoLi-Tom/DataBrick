import React, { useEffect, useState } from 'react';
import axios from '../http';

import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import './AssignStatusModal.css';

const AssignStatusModal = ({ show, onClose, status, bricks, setBricks }) => {
    const [selectedBrick, setSelectedBrick] = useState(null);
    const [availableBricks, setAvailableBricks] = useState(() => {
        /* 
        * Since bricks may not have all the bricks, 
        * set brick number between 1-226 which does not have the assigning status available 
        */
        const totalBricks = Array.from({ length: 226 }, (_, i) => i + 1); 
        return totalBricks.filter(brickId => {
            const brick = bricks.find(b => b.id === brickId);
            return !brick || !brick.statuses.some(existStatus => existStatus.id === status.id);
        });
    });    
    const [assignResult, setAssignResult] = useState("");

    useEffect(() => {
        setAvailableBricks(() => {
            const totalBricks = Array.from({ length: 226 }, (_, i) => i + 1); 
            return totalBricks.filter(brickId => {
                const brick = bricks.find(b => b.id === brickId);
                return !brick || !brick.statuses.some(existStatus => existStatus.id === status.id);
            });
        });        
    }, [bricks, status])

    const handleSelectBrick = (brickId) => {
        setSelectedBrick(brickId);
    };

    const assignStatusToBrick = async() => {
        if (selectedBrick) {

            if (!bricks.some(brick => brick.id === selectedBrick))
            {
                try {
                    const response = await axios.post('api/bricks/',
                        {
                            id: selectedBrick,
                            statuses: [],
                        }, {
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
    
                    // Add the status to the status list
                    setBricks(prevBricks => [
                        ...prevBricks,
                        response.data, // Assuming response contains status details
                    ]);
                } catch (error) {
                    console.error("Error assigning status:", error);
                }
            }

            const formData = new FormData();
            formData.append('id', selectedBrick);
            formData.append('status_id', status.id);
            formData.append('action_type', 'add');

            try {
                const response = await axios.patch(`api/bricks/${selectedBrick}/modify-status/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                });
                const updatedBrick = response.data;

                setBricks(prevBricks => prevBricks.map(b =>
                    b.id === updatedBrick.id ? updatedBrick : b
                ));
                
                // Reset selectedBrick to null to go back to "Select a brick" option
                setAssignResult("Status assigned successfully!");
                setSelectedBrick(null);
            } catch (error) {
                console.error("Error assigning status:", error);
                setAssignResult("Failed to assign status. Please try again.");
            }
        }
    };

    if (!show) {
        return null;
    }

    return (
        <Modal className='assign-status-modal'>
                <h1 className='assign-status-modal-header'>
                    Please choose a brick to assign Status {status.name}
                </h1>

                <select
                    className="select-brick"
                    onChange={(e) => handleSelectBrick(Number(e.target.value))}
                    value={selectedBrick || ""}
                >
                    <option value="" disabled>Select a brick</option>
                    {availableBricks.map((brick) => (
                        <option key={brick} value={brick}>
                            Brick {brick}
                        </option>
                    ))}
                </select>

                <p className='assign-status-feedback'>{assignResult}</p> 

                <div className='assign-status-buttons'>
                    <Button className='confirm-assign-status-button' onClick={() => assignStatusToBrick()} disabled={!selectedBrick} label={"Confirm"}/>
                    <Button className='close-assign-modal-button' onClick={onClose} label={"Close"}/>
                </div>
        </Modal>
    );
};

export default AssignStatusModal;
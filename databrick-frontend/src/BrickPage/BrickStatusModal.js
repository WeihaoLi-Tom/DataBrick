import React, { useEffect, useState } from "react";
import axios from '../http';

import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import "./BrickStatusModal.css";

// Represents each status 
const StatusItem = ({ status, selectedStatus, handleSelectStatus }) => {
    const isSelected = selectedStatus ? selectedStatus.id === status.id : false;

    return (
        <div
            className={`brick-status-item ${isSelected ? 'selected' : ''}`}
            onClick={() => handleSelectStatus(status.id)}
        >
            <div className='brick-status-item-info'>
                <p className='brick-status-item-info-title'>
                    {status.name}
                </p>
            </div>
        </div>
    );
};

// Represents each history item
const HistoryItem = ({ history }) => {
    return (
        <div className='brick-history-item'>
            <p>
                <strong>{history.status.name}</strong>
                : {history.action_type.toUpperCase()}
                , <i>{new Date(history.timestamp).toLocaleString()}</i>
            </p>
        </div>
    );
};

// Fetch brick status history
const fetchBrickHistory = async (brickId) => {
    try {
        const response = await axios.get(`api/bricks/${brickId}/history/`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch history:", error);
        return [];
    }
};

const BrickStatusModal = ({ show, onClose, brick, addStatusToBrick, removeStatusFromBrick, editingControl = false }) => {
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [brickHistory, setBrickHistory] = useState([]);

    useEffect(() => {
        if (show) {
            fetchBrickHistory(brick.id)
                .then(data => setBrickHistory(data))
                .catch(error => console.error("Failed to fetch history:", error));
        }
    }, [show, brick.id]);

    const handleSelectStatus = (id) => {
        if (selectedStatus && selectedStatus.id === id) {
            setSelectedStatus(null);
        } else {
            setSelectedStatus(brick.statuses.find(status => status.id === id));
        }
    };

    if (!show) {
        return null;
    }

    return (
        <Modal className='brick-status-modal'>
            <div className='brick-status-modal-header'>
                <h1>Status for Brick {brick.id}</h1>
                <Button
                    className='brick-status-modal-close-button'
                    onClick={onClose}
                    label={"X"}
                />
            </div>

            {/* Main body of the status modal UI */}
            <div className='brick-status-modal-body'>
                {/* LHS: Current brick statuses */}
                <div className='brick-status-list'>
                    <h3>Current Statuses</h3>
                    {brick.statuses.length ? (
                        <ul className="brick-status-list-ul">
                            {brick.statuses.map(status => (
                                <StatusItem
                                    key={status.id}
                                    status={status}
                                    selectedStatus={selectedStatus}
                                    handleSelectStatus={handleSelectStatus} />
                            ))}
                        </ul>
                    ) : (
                        <p>No statuses assigned to this brick.</p>
                    )}
                    {editingControl && (
                        <div className='brick-status-buttons'>
                            <Button className='brick-add-status-button' onClick={() => addStatusToBrick()} label={"Add"} />
                            <Button className='brick-remove-status-button' onClick={() => removeStatusFromBrick(selectedStatus)} disabled={!selectedStatus} label={"Remove"} />
                        </div>
                    )}
                </div>

                {/* RHS: Brick status history */}
                <div className='brick-status-history'>
                    <h3>Status History</h3>
                    {brickHistory.length ? (
                        <ul className="brick-status-history-ul">
                            {brickHistory.map((history, index) => (
                                <HistoryItem
                                    key={index}
                                    history={history} />
                            )).reverse()}
                        </ul>
                    ) : (
                        <p>No history available for this brick.</p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default BrickStatusModal;
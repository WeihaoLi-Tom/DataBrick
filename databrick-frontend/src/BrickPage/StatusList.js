import React, { useState } from "react";

import { Button, DeleteButton } from "../components/Button";
import "./StatusList.css"

import AddStatusModal from "./AddStatusModal";
import RemoveStatusModal from "./RemoveStatusModal";
import AssignStatusModal from "./AssignStatusModal";

// Represents each status 
const StatusItem = ({ status, selectedStatus, handleSelectStatus, handleAssignStatus, editingControl = false }) => {
    const isSelected = selectedStatus ? selectedStatus.id === status.id : false;

    return (
        <div
            className={`status-list-item ${isSelected ? 'selected' : ''}`} 
            onClick={() => handleSelectStatus(status.id)}
        >
            <div className='status-list-item-info'>
                <p className='status-list-item-info-title'>
                    {status.name}
                </p>
            </div>
            {editingControl &&
                <Button className="status-list-item-assign-button" onClick={() => handleAssignStatus(status)} label={"Assign"}/>
            }   
        </div>
    );
};

const StatusList = ({ bricks, setBricks, statuses, setStatuses, handleViewStatusBrick, editingControl = false }) => {
    const [showAddStatusModal, setShowAddStatusModal] = useState(false);
    const [showRemoveStatusModal, setShowRemoveStatusModal] = useState(false);
    const [showAssignStatusModal, setShowAssignStatusModal] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [statusToAssign, setStatusToAssign] = useState(null);

    const handleSelectStatus = (id) => {
        if (selectedStatus && selectedStatus.id === id) {
            setSelectedStatus(null);
            handleViewStatusBrick(null);
        } else {
            setSelectedStatus(statuses.find(status => status.id === id));
            handleViewStatusBrick(statuses.find(status => status.id === id));
        }
    };

    const handleAddStatus = () => {
        setShowAddStatusModal(true);
    }

    const handleCloseAddStatus = () => {
        setShowAddStatusModal(false);
    }

    const handleRemoveStatus = () => {
        setShowRemoveStatusModal(true);
    }

    const handleCloseRemoveStatus = () => {
        setShowRemoveStatusModal(false);
    }

    const handleAssignStatus = (status) => {
        setStatusToAssign(status);
        setShowAssignStatusModal(true);
    }

    const handleCloseAssignStatus = () => {
        setShowAssignStatusModal(false);
    }

    return (
        <div className='status-list'>
            <h1 className='status-list-title'>Status</h1>
            {statuses && statuses.length ? (
                <div className='status-list-content'>
                    {statuses.map((status, index) => (
                        <StatusItem
                            key={status.id.toString()}
                            status={status}
                            selectedStatus={selectedStatus}
                            handleSelectStatus={handleSelectStatus}
                            handleAssignStatus={handleAssignStatus}
                            editingControl={editingControl}
                        />
                    ))}
                </div>
            ) : (
                <div className='status-list-content'>No status available</div>
            )}
            {editingControl && (
                <div className='status-list-buttons'>
                    <Button className='add-status-button' onClick={handleAddStatus} label={"Create"}/>
                    <DeleteButton className='remove-status-button' onClick={handleRemoveStatus} disabled={!selectedStatus} label={"Delete"}/>
                </div>
            )}
            {showAddStatusModal &&
                (<AddStatusModal
                    show={showAddStatusModal}
                    onClose={handleCloseAddStatus}
                    statuses={statuses}
                    setStatuses={setStatuses} />
                )}
            {showRemoveStatusModal &&
                (<RemoveStatusModal
                    show={showRemoveStatusModal}
                    onClose={handleCloseRemoveStatus}
                    selectedStatus={selectedStatus}
                    setSelectedStatus={setSelectedStatus}
                    setStatuses={setStatuses}
                    setBricks={setBricks} />
                )}

            {showAssignStatusModal && 
                (<AssignStatusModal
                    show={showAssignStatusModal}
                    onClose={handleCloseAssignStatus}
                    status={statusToAssign}
                    bricks={bricks}
                    setBricks={setBricks}
                />)
            }
        </div>

    );
}

export default StatusList;
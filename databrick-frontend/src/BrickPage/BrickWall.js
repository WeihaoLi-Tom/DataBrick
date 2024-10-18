import React, { useState, useEffect } from 'react';
import axios from '../http';
import { westWallSize, westWallBricks, eastWallSize, eastWallBricks } from "../Constants.js"
import BrickStatusModal from './BrickStatusModal';
import AddStatusToBrickModal from './AddStatusToBrickModal';
import RemoveStatusFromBrickModal from './RemoveStatusFromBrickModal';

const BrickWall = ({ isWest, bricks, setBricks, statuses, setStatuses, viewingStatus, editingControl = false }) => {
    const [brickWall, setBrickWall] = useState({});
    const [columnNumbers, setColumnNumbers] = useState(0);
    const [rowNumbers, setRowNumbers] = useState(0);
    const [selectedBrick, setSelectedBrick] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [showBrickStatusModal, setShowBrickStatusModal] = useState(false);
    const [showAddStatusModal, setShowAddStatusModal] = useState(false);
    const [showRemoveStatusModal, setShowRemoveStatusModal] = useState(false);
    const [bricksWithViewingStatus, setBricksWithViewingStatus] = useState([]);

    useEffect(() => {
        if (isWest) {
            setBrickWall(westWallBricks);
            setColumnNumbers(westWallSize["col"]);
            setRowNumbers(westWallSize["row"]);
        } else {
            setBrickWall(eastWallBricks);
            setColumnNumbers(eastWallSize["col"]);
            setRowNumbers(eastWallSize["row"]);
        }
    }, [isWest]);

    useEffect(() => {
        if (selectedBrick)
        {
            setSelectedBrick(bricks.find(brick => brick.id === selectedBrick.id));
        }
    }, [bricks, selectedBrick])

    useEffect(() => {
        // Clear all viewed bricks before making new selection
        setBricksWithViewingStatus([]);

        // If a viewing status is chosen, update bricks currently viewed
        if (viewingStatus)
        {
            bricks.forEach(brick => {
                if (brick.statuses.some(status =>  status.id === viewingStatus.id))
                    setBricksWithViewingStatus(prevBricks => [...prevBricks, brick.id]);
            });
        }
    }, [viewingStatus, bricks])

    const columns = Array.from({ length: columnNumbers[1]-columnNumbers[0]+1 }, (_, i) => i + columnNumbers[0]);

    const generateGrid = () => {
        const rows = [];
        const letters = Array.from({ length: columnNumbers[1]-columnNumbers[0] }, (_, i) => String.fromCharCode(65 + i + rowNumbers[0]));

        for (let i = 0; i < rowNumbers[1] + 1; i++) { // Rows + 1 Header
            const bricks = [];

            for (let j = columnNumbers[0]; j <= columnNumbers[1]; j++) { // Columns
                const brickLoc = `${letters[i - 1]}${j}`; // i - 1, first row is column header
                const brickNumber = brickWall[brickLoc];

                const isBrickWithViewingStatus = bricksWithViewingStatus.some(brickId => brickId === Number(brickNumber));

                bricks.push(
                    <div
                        key={brickLoc}
                        className={`grid ${brickNumber ? `brick ${brickNumber} ${isBrickWithViewingStatus ? 'viewing' : ''}` : ''}`}
                        style={brickNumber && !isBrickWithViewingStatus ? {backgroundColor: '#6699cc'} : {}}
                        onClick={() => handleBrickClick(Number(brickNumber))} // Click a video for detail 
                    >
                        {brickNumber}
                    </div>
                );
            }

            rows.push(
                <div key={i} className='grid-row'>
                    {i === 0 ? (
                        <div className="column-headers">
                            <div className="column-header-start">{/* Empty grid for alignment */}</div>
                            {columns.map(col => (
                                <div key={col} className="column-header">
                                    {col}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='grid-row-bricks'>
                            <div className="row-label">
                                {i ? letters[i - 1] : ''}
                            </div>
                            {bricks}
                        </div>
                    )
                    }
                </div >
            );
        }

        return rows;
    };

    const handleBrickClick = async (brickNumber) => {
        const brick = bricks.find(brick => brick.id === brickNumber);
        if (!brick) {
            try {
                const response = await axios.post('api/bricks/',
                    {
                        id: brickNumber,
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
                setSelectedBrick({ id: brickNumber, statuses: [] });
            } catch (error) {
                console.error("Error adding status:", error);
            }
        }
        else
            setSelectedBrick(brick);
        setShowBrickStatusModal(true);
    };

    const handleCloseBrickStatusModal = () => {
        setSelectedBrick(null);
        setShowBrickStatusModal(false);
    };

    const handleAddStatus = () => {
        setShowAddStatusModal(true);
        setShowBrickStatusModal(false);
    }

    const handleCloseAddStatus = async() => {
        setShowBrickStatusModal(true);
        setShowAddStatusModal(false);
    }

    const handleRemoveStatus = (status) => {
        setSelectedStatus(status);
        setShowRemoveStatusModal(true);
        setShowBrickStatusModal(false);
    }

    const handleCloseRemoveStatus = async() => {
        setSelectedStatus(null);
        setShowBrickStatusModal(true);
        setShowRemoveStatusModal(false);
    }

    return (
        <div className="wall-container">
            <div className="grid-container">
                <div className="wall-header">
                    <h1 className='wall-title'>{isWest ? "WEST WALL" : "EAST WALL"}</h1>
                </div>
                {generateGrid()}
            </div>
            {showBrickStatusModal && selectedBrick && (
                <BrickStatusModal
                    show={showBrickStatusModal}
                    onClose={handleCloseBrickStatusModal}
                    brick={selectedBrick}
                    addStatusToBrick={handleAddStatus}
                    removeStatusFromBrick={handleRemoveStatus}
                    editingControl={editingControl}
                />
            )}
            {showAddStatusModal &&
                (<AddStatusToBrickModal
                    show={showAddStatusModal}
                    onClose={handleCloseAddStatus}
                    brick={selectedBrick}
                    statuses={statuses}
                    setBricks={setBricks} />
                )}
            {showRemoveStatusModal &&
                (<RemoveStatusFromBrickModal
                    show={showRemoveStatusModal}
                    onClose={handleCloseRemoveStatus}
                    selectedStatus={selectedStatus}
                    brick={selectedBrick}
                    setBricks={setBricks} />
                )}
        </div>
    );
};

export default BrickWall;

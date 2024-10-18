import React, { useState, useEffect } from 'react';
import { westWallSize, westWallBricks, eastWallSize, eastWallBricks } from "../Constants.js"
import VideoPlayerModal from "./VideoPlayerModal.js";

import "./PreviewWall.css";

const PreviewWall = ({ isWest, videos, locations, brokenBricks, previewFrames, showFrameCount, frameNumber, setFrameNumber, onRemove, onDragStart, onDrop }) => {
    const [brickWall, setBrickWall] = useState({});
    const [columnNumbers, setColumnNumbers] = useState(0);
    const [rowNumbers, setRowNumbers] = useState(0);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [duplicatedVideo, setDuplicatedVideo] = useState(null);

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

    const columns = Array.from({ length: columnNumbers[1]-columnNumbers[0]+1 }, (_, i) => i + columnNumbers[0]);

    const handleClickVideo = (video) => {
        setSelectedVideo(video);
    };

    const handleCloseVideo = () => {
        setSelectedVideo(null);
    };

    const handleRemoveVideo = (e, brickId) => {
        e.stopPropagation();
        onRemove(Number(brickId));
    };

    const handleDuplicateVideo = (e, video) => {
        e.stopPropagation();
        setDuplicatedVideo(video);
    }

    const handleDragStart = (e, video, brickId) => {
        onDragStart(e, video, Number(brickId)); // Continue with the original drag start logic
    };

    const handleDrop = (e, brickId) => {
        onDrop(Number(brickId));
    };

    const generateGrid = () => {
        const rows = [];
        const letters = Array.from({ length: columnNumbers[1]-columnNumbers[0] }, (_, i) => String.fromCharCode(65 + i + rowNumbers[0]));

        for (let i = 0; i < rowNumbers[1] + 1; i++) { // Rows + 1 Header
            const bricks = [];

            for (let j = columnNumbers[0]; j <= columnNumbers[1]; j++) { // Columns
                const brickLoc = `${letters[i - 1]}${j}`; // i - 1, first row is column header
                const brickNumber = brickWall[brickLoc];

                // Based on locations
                let assignedVideo = null;
                if (locations && locations.find) {
                    const curLocation = locations.find(location => location.location_number === Number(brickNumber));
                    assignedVideo = curLocation && curLocation.video ? videos.find(video => video.id === curLocation.video) : null;
                }

                const isBroken = brokenBricks.some(brick => brick.id === Number(brickNumber)) ? true : false;
                const isDroppable = brickNumber ? true : false; // Set droppable based on presence of brickNumber

                bricks.push(
                    <div
                        key={brickLoc}
                        className={`preview-grid ${brickNumber ? `brick ${brickNumber} ${isBroken ? 'broken' : ''}` : ''}`}
                        droppable={isDroppable ? 'true' : 'false'} // Make draggable only if `brickNumber` is present
                        onClick={() => assignedVideo && handleClickVideo(assignedVideo)} // Click a video for detail
                        onDragOver={isDroppable ? ((e) => e.preventDefault()) : undefined} // Allow drop
                        onDrop={isDroppable ? (e) => handleDrop(e, brickNumber) : undefined} // Handle drop to a different brick
                    >
                        {assignedVideo ? (
                            <div
                                className="grid-video-container"
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, assignedVideo, brickNumber)} // Start dragging the video
                            >
                                <button className="grid-video-delete-button" onClick={(e) => handleRemoveVideo(e, brickNumber)}>X</button>
                                <button className="grid-video-duplicate-button" onClick={(e) => handleDuplicateVideo(e, assignedVideo)}>+</button>
                                <img
                                    src={previewFrames[assignedVideo.id]} // Set preview frame URL
                                    alt="preview-frame"
                                    className="grid-video-frame" // Add a class for styling
                                />
                            </div>
                        ) : ''}
                    </div>
                );
            }

            rows.push(
                <div key={i} className='grid-row'>
                    {i === 0 ? (
                        <div className="column-headers">
                            <div className="preview-column-header-start">{/* Empty grid for alignment */}</div>
                            {columns.map(col => (
                                <div key={col} className="preview-column-header">
                                    {col}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='grid-row-bricks'>
                            <div className="preview-row-label">
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

    return (
        <div className="wall-container">
            <div className="grid-container">
                <div className="wall-header">
                    
                    <h1 className='wall-title'>{isWest ? "WEST WALL" : "EAST WALL"}</h1>

                    <div className={"frame-select"}>
                        <label htmlFor="frame-select-bar-title">Preview Frame: </label>
                        <input
                            className='frame-select-bar'
                            id="progress-bar"
                            type="range"
                            min="1"
                            max={showFrameCount}
                            value={frameNumber + 1}
                            onChange={(e) => {setFrameNumber(e.target.value - 1)}} // Call the handler when changed
                        />
                        <span className="current-frame">{frameNumber + 1}</span>
                    </div>

                    <div className="wall-controls">
                        {duplicatedVideo ? <div className='duplicated-video-sign'>Duplicated video is here: </div> : ''}
                        <div className='duplicated-video-container'>
                            {duplicatedVideo ?
                                <img
                                    src={previewFrames[duplicatedVideo.id]} // Set preview frame URL
                                    alt="duplicated-preview-frame"
                                    className="duplicated-video-frame" // Add a class for styling
                                    draggable={true}
                                    droppable={'true'} // Make draggable only if `brickId` is present
                                    onClick={() => handleClickVideo(duplicatedVideo)} // Click a video for detail
                                    onDragOver={((e) => e.preventDefault())} // Allow drop
                                    onDrop={(e) => handleDrop(e, "-1")} // Handle drop to a different brick
                                    onDragStart={(e) => handleDragStart(e, duplicatedVideo, "-1")} // Start dragging the video
                                />
                                : ''}
                        </div>

                    </div>
                </div>
                {generateGrid()}
            </div>
            {selectedVideo && <VideoPlayerModal video={selectedVideo} onClose={handleCloseVideo} />}
        </div>
    );
};

export default PreviewWall;
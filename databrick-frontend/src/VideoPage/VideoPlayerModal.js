import React, { useRef } from "react";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import "./VideoPlayerModal.css";

const VideoPlayerModal = ({ video, onClose }) => {
    const videoRef = useRef(null);  // Reference to the video element

    if (!video)
        return;

    return (
        <Modal className={"video-player-modal"}>
                <Button onClick={onClose} className="close-button" label={"X"}/>
                <h1>{video.title}</h1>
                <video ref={videoRef} controls autoPlay src={video.file} className='video-player' data-testid="video-player"/>
        </Modal>
    )
}

export default VideoPlayerModal;
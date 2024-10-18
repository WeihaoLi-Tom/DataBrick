import React, { useState, useEffect, useMemo } from 'react';
import Cropper from 'react-easy-crop';

import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import './CropModal.css';

const CropModal = ({ show, file, onClose, resolution }) => {
    const targetWidth = 600;
    const targetHeight = 400;

    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [mediaURL, setMediaURL] = useState(null);
    const [zoom, setZoom] = useState(1);

    const [isVideo, setIsVideo] = useState(false); // is the file a video?
    const [croppedCoordinates, setCroppedCoordinates] = useState(null);
    const [isResolutionValid, setIsResolutionValid] = useState(true);
    const [isFormatValid, setIsFormatValid] = useState(true);

    const targetResolution = useMemo(() => resolution || [854, 480], [resolution]);

    useEffect(() => {
        if (file) {
            const objectURL = URL.createObjectURL(file);
            setMediaURL(objectURL);

            return () => URL.revokeObjectURL(objectURL);
        }
    }, [file]);

    useEffect(() => {
        if (file) {
            const fileType = file.type;

            // Check if the file is either a video or an image
            if (fileType.startsWith('video/') || fileType.startsWith('image/')) {
                setIsFormatValid(true);
                setIsVideo(fileType.startsWith('video/'));
            } else {
                setIsFormatValid(false);
            }
        }
    }, [file]);

    useEffect(() => {
        if (file && mediaURL) {
            const img = new Image();
            img.src = mediaURL;
            img.onload = () => {
                const scaleFactor = Math.min(targetWidth / img.width, targetHeight / img.height);
                setZoom(scaleFactor);
            };
        }
    }, [file, mediaURL]);

    useEffect(() => {
        if (file && mediaURL) {
            if (isVideo) {
                const video = document.createElement('video');
                video.src = mediaURL
                video.onloadedmetadata = () => {
                    const scaleFactor = Math.min(targetWidth / video.videoWidth, targetHeight / video.videoHeight);
                    setZoom(scaleFactor);
                    if (video.videoWidth < targetResolution[0] || video.videoHeight < targetResolution[1]) {
                        setIsResolutionValid(false);
                    } else {
                        setIsResolutionValid(true);
                    }
                };
            }
            else {
                const img = new Image();
                img.src = mediaURL;
                img.onload = () => {
                    const scaleFactor = Math.min(targetWidth / img.width, targetHeight / img.height);
                    setZoom(scaleFactor);
                    if (img.width < targetResolution[0] || img.height < targetResolution[1]) {
                        setIsResolutionValid(false);
                    } else {
                        setIsResolutionValid(true);
                    }
                };

            }
        }
    }, [file, mediaURL, isVideo, targetResolution]);

    if (!show) {
        return null;
    }

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedCoordinates({ x: croppedAreaPixels.x, y: croppedAreaPixels.y });

    }
    const handleConfirmCrop = () => {
        if (croppedCoordinates) {
            onClose(croppedCoordinates, true);
        } else {
            onClose(null, false);
        }
    }

    const isCropDisabled = !isResolutionValid || !isFormatValid;

    return (
        <Modal className={"crop-modal"}>
            <h1>Crop file</h1>
            <Button onClick={() => onClose(null)} className="back-button" label={"X"} />
            {!isFormatValid ? (
                <p className='invalid-info'>File format must be a video or an image.</p>
            ) : !isResolutionValid ? (
                <p className='invalid-info'>Resolution must be bigger than {targetResolution[0]}x{targetResolution[1]}.</p>
            ) :
                (
                    <div style={{ width: targetWidth, height: targetHeight, position: 'relative' }}>
                        <Cropper
                            {...(isVideo ? { video: mediaURL } : { image: mediaURL })}
                            crop={crop}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            cropSize={{ width: targetResolution[0] * zoom, height: targetResolution[1] * zoom }}
                            style={{
                                mediaStyle: {
                                    objectFit: 'contain',
                                    width: '100%',
                                    height: '100%',
                                },
                            }}
                        />
                    </div>
                )}
            <Button
                onClick={handleConfirmCrop}
                disabled={isCropDisabled}
                label={"Crop"}
                className={"crop-button"}
            />
        </Modal>
    )
}

export default CropModal;
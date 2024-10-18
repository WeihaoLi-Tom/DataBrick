import React, { useRef, useState, useEffect, useCallback } from 'react';
import axios from '../http';
import { getUploadConstraints, fetchUploadConstraints } from '../Constants';
import CropModal from './CropModal';

import { Modal } from '../components/Modal';
import { Button, DeleteButton } from '../components/Button';
import './VideoUploadModal.css';

const VideoUploadModal = ({ show, onClose, videos, setVideos, showId }) => {
    const fileInputRef = useRef(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});
    const [uploadStatus, setUploadStatus] = useState({});  // 'success', 'error', or null
    const [errorMessages, setErrorMessages] = useState({});      // Error message to display
    const [estimatedTimeLeft, setEstimatedTimeLeft] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const [constraints, setConstraints] = useState(null);

    const [showCrop, setShowCrop] = useState(false);
    const [fileToCrop, setFileToCrop] = useState(null);
    const [croppedFiles, setCroppedFiles] = useState({});
    const [fileCoordinates, setFileCoordinates] = useState({});

    // Helper function to reduce code repetition
    const resetModal = () => {
        setSelectedFiles([]);
        setUploadProgress({});
        setUploadStatus({});
        setErrorMessages({});
        setEstimatedTimeLeft({});
        setCroppedFiles({});
        setFileCoordinates({});
        setIsUploading(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset file input
        }
    }

    // Clear upload status + error message on modal close
    useEffect(() => {
        if (!show) {
            resetModal();
        }
    }, [show]);

    useEffect(() => {
        const loadConstraints = async () => {
            await fetchUploadConstraints();
            const fetchedConstraints = getUploadConstraints();
            if (fetchedConstraints) {
                setConstraints(fetchedConstraints);
            }
        };

        loadConstraints();
    }, []);

    const noNeedCropping = useCallback((file) => {
        return new Promise((resolve, reject) => {
            const minWidth = constraints?.minWidth || null;
            const minHeight = constraints?.minHeight || null;
            const fileType = file.type;

            // Check if the file is an image (including GIF) or a video
            const isImage = fileType.startsWith('image/');
            const isVideo = fileType.startsWith('video/');

            if (isImage) {
                // Check image dimensions
                const image = new Image();
                const blobURL = URL.createObjectURL(file);
                image.src = blobURL;

                image.onload = () => {
                    const { width, height } = image;
                    if (width === minWidth && height === minHeight) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                    URL.revokeObjectURL(blobURL); // Clean up the URL
                };

                image.onerror = () => {
                    reject(new Error(`Failed to load the selected image file.`));
                };
            } else if (isVideo) {
                // Check video dimensions
                const video = document.createElement('video');
                const blobURL = URL.createObjectURL(file);
                video.src = blobURL;

                video.onloadedmetadata = () => {
                    const { videoWidth, videoHeight } = video;
                    if (videoWidth === minWidth && videoHeight === minHeight) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                    URL.revokeObjectURL(blobURL); // Clean up the URL
                };

                video.onerror = () => {
                    reject(new Error(`Failed to load the selected video file.`));
                };
            }
        });
    }, [constraints?.minWidth, constraints?.minHeight]);

    useEffect(() => {
        const checkNeedCropping = async () => {
            for (const file of selectedFiles) {
                if (!croppedFiles[file.name]) {
                    try {
                        const noCropping = await noNeedCropping(file);
                        if (noCropping) {
                            setCroppedFiles(prev => ({ ...prev, [file.name]: true }));
                        }
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
        };
        checkNeedCropping();
    }, [selectedFiles, croppedFiles, noNeedCropping]);

    //check file type
    const allowedTypes = ['video/*', 'image/*'];

    const removeFileRecord = (fileToRemove) => {
        setUploadProgress(prevProgress => {
            const updatedProgress = { ...prevProgress };
            delete updatedProgress[fileToRemove.name];
            return updatedProgress;
        });
        setUploadStatus(prevStatus => {
            const updatedStatus = { ...prevStatus };
            delete updatedStatus[fileToRemove.name];
            return updatedStatus;
        });
        setErrorMessages(prevMessages => {
            const updatedMessages = { ...prevMessages };
            delete updatedMessages[fileToRemove.name];
            return updatedMessages;
        });
        setCroppedFiles(prevCropped => {
            const updatedCropped = { ...prevCropped };
            delete updatedCropped[fileToRemove.name];
            return updatedCropped;
        });
        setFileCoordinates(prevCoords => {
            const updatedCoords = { ...prevCoords };
            delete updatedCoords[fileToRemove.name];
            return updatedCoords;
        });
        setEstimatedTimeLeft(prevTime => {
            const newTime = { ...prevTime };
            delete newTime[fileToRemove.name];
            return newTime;
        });
    };

    const validateFile = (file) => {
        return new Promise((resolve, reject) => {
            const maxDuration = constraints.maxDuration; // 5 minutes = 300 seconds
            const minWidth = constraints.minWidth;
            const minHeight = constraints.minHeight;
            const allowedFrameRate = constraints.allowedFrameRate;
            const frameRateMargin = constraints.frameRateMargin;
            const fileType = file.type;

            // Check if file is a video, image, or GIF
            const isVideo = fileType.startsWith('video/');
            const isImage = fileType.startsWith('image/');
            // This can be included in isImage but keeping it separate for clarity
            const isGIF = fileType === 'image/gif';  

            if (!isVideo && !isImage && !isGIF) {
                reject(new Error(`Unsupported file type: ${fileType}. Only video, image, and GIF files are allowed.`));
                return;
            }

            if (isVideo) {
                // Create a FileReader to read the video file
                const fileReader = new FileReader();
                fileReader.onload = () => {
                    // Create a video element to load the video data
                    const video = document.createElement('video');
                    video.preload = 'metadata'; // Only load metadata, not the full video

                    // Create a Blob URL for the video file
                    const blobURL = URL.createObjectURL(new Blob([file], { type: file.type }));
                    video.src = blobURL;

                    // Listen for metadata loading
                    video.onloadedmetadata = () => {
                        const { duration, videoWidth, videoHeight } = video;

                        // Check video properties
                        const frameRate = Math.round(video.webkitDecodedFrameRate || allowedFrameRate); // Fallback to 30 if frame rate cannot be detected

                        // Validate video properties
                        if (frameRate !== allowedFrameRate) {
                            reject(new Error(`Invalid frame rate: ${frameRate}. Expected ${allowedFrameRate} fps.`));
                        } else if (duration > maxDuration) {
                            reject(new Error(`Invalid duration: ${Math.floor(duration)} seconds. Maximum allowed is ${maxDuration} seconds (${maxDuration / 60} minutes).`));
                        } else if (videoWidth < minWidth || videoHeight < minHeight) {
                            reject(new Error(`Invalid resolution: ${videoWidth}x${videoHeight}. Minimum required is ${minWidth}x${minHeight}.`));
                        } else {
                            resolve(true);
                        }

                        // Revoke the Blob URL after usage
                        URL.revokeObjectURL(blobURL);
                    };

                    // Handle video loading errors
                    video.onerror = () => {
                        reject(new Error(`Failed to load the selected file.`));
                    };
                };

                // Start reading the video file
                fileReader.onerror = () => {
                    reject(new Error(`Failed to load the selected file.`));
                };
                fileReader.readAsArrayBuffer(file); // Read file as ArrayBuffer for Blob creation
            } else if (isImage) {
                // Image validation logic
                const image = new Image();
                const blobURL = URL.createObjectURL(new Blob([file], { type: file.type }));
                image.src = blobURL;

                image.onload = () => {
                    const { width, height } = image;
                    if (width < minWidth || height < minHeight) {
                        reject(new Error(`Invalid image resolution: ${width}x${height}. Minimum required is ${minWidth}x${minHeight}.`));
                    } else {
                        resolve(true); // Image file is valid
                    }
                    URL.revokeObjectURL(blobURL);
                };

                image.onerror = () => {
                    reject(new Error(`Failed to load the selected image file.`));
                };
            } else if (isGIF) {
                const image = new Image();
                const blobURL = URL.createObjectURL(new Blob([file], { type: file.type }));
                image.src = blobURL;

                const getGIFDuration = (gifData) => {
                    let duration = 0;
                    let frameCount = 0;

                    for (let i = 0; i < gifData.length - 9; i++) {
                        if (gifData[i] === 0x21 && gifData[i + 1] === 0xF9 && gifData[i + 2] === 0x04) {
                            const delay = gifData[i + 4] | (gifData[i + 5] << 8);
                            duration += delay / 100;
                            frameCount++;
                        }
                    }

                    const frameRate = (frameCount / duration).toFixed(2);
                    return { duration, frameRate };
                };

                image.onload = () => {
                    const { width, height } = image;

                    if (width < minWidth || height < minHeight) {
                        reject(new Error(`Invalid resolution: ${width}x${height}. Minimum required is ${minWidth}x${minHeight}.`));
                    } else {
                        const gifReader = new FileReader();
                        gifReader.onload = (e) => {
                            const gifData = new Uint8Array(e.target.result);
                            const { gifDuration, frameRate } = getGIFDuration(gifData);

                            if (gifDuration > maxDuration) {
                                reject(new Error(`Invalid GIF duration: ${gifDuration} seconds. Maximum allowed is ${maxDuration} seconds (${maxDuration / 60} minutes).`));
                            } else if (frameRate > allowedFrameRate - frameRateMargin && frameRate < allowedFrameRate + frameRateMargin) {
                                reject(new Error(`Invalid frame rate: ${frameRate} fps. Expected ${allowedFrameRate} fps.`));
                            } else {
                                resolve(true);
                            }
                        };

                        gifReader.onerror = () => {
                            reject(new Error(`Failed to validate the selected GIF file.`));
                        };
                        gifReader.readAsArrayBuffer(file);
                    }
                    URL.revokeObjectURL(blobURL);
                };

                image.onerror = () => {
                    reject(new Error(`Failed to load the selected GIF file.`));
                };
            }
        });
    };

    const handleRemoveFile = (fileToRemove) => {
        setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileToRemove.name));
        removeFileRecord(fileToRemove);
    };

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);

        const existingFileNames = selectedFiles.map(file => file.name);
        const duplicateFiles = files.filter(file => existingFileNames.includes(file.name));
        let confirmAdd = true
        if (duplicateFiles.length > 0) {
            confirmAdd = window.confirm(
                `The following files are already in the queue: ${duplicateFiles.map(file => file.name).join(', ')}. Do you want to add them again?`
            );
        }

        setSelectedFiles(prevFiles => {
            if (duplicateFiles.length > 0) {
                const newFiles = [...prevFiles, ...files.filter(file => !existingFileNames.includes(file.name))];

                if (!confirmAdd) {
                    return newFiles;
                } else {
                    duplicateFiles.forEach(file => { removeFileRecord(file); });
                    return [...newFiles];
                }
            }
            return [...prevFiles, ...files];
        });


    };

    const handleUpload = async () => {
        setIsUploading(true);

        // Max files to upload at the same time - set as 1 if error retrieving constant (code fails if set to undef)
        const MAX_CONCURRENT_UPLOADS = Number(process.env.REACT_APP_MAX_CONCURRENT_UPLOADS) || 1;
        const uploadQueue = []; // Queue to manage pending uploads
        let activeUploads = 0; // Counter for active uploads

        const uploadFile = async (file) => {
            try {
                await validateFile(file);

                // Link with backend
                const formData = new FormData();
                formData.append('file', file);
                formData.append('title', file.name);
                formData.append('show', showId)
                formData.append('crop_x', fileCoordinates[file.name]?.x || 0);
                formData.append('crop_y', fileCoordinates[file.name]?.y || 0);

                const startTime = Date.now(); // Set the start time when the upload begins

                const response = await axios.post('api/videos/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },

                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));

                        // Calculate elapsed time
                        const elapsedTime = (Date.now() - startTime) / 1000; // in seconds

                        // Avoid division by zero or negative values
                        if (elapsedTime > 0 && progressEvent.loaded > 0) {
                            // Calculate average speed (bytes per second)
                            const averageSpeed = progressEvent.loaded / elapsedTime;
                            // Estimate remaining time (seconds)
                            const remainingBytes = progressEvent.total - progressEvent.loaded;
                            const timeLeft = remainingBytes / averageSpeed;
                            setEstimatedTimeLeft(prev => ({ prev, [file.name]: timeLeft }));
                        }
                    }
                });

                // Add the uploaded video to the video list
                setVideos(prevVideos => [
                    ...prevVideos,
                    response.data, // Assuming response contains video details
                ]);
                setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
            } catch (error) {
                console.error("Error uploading file:", error);
                // Handle error response
                setErrorMessages(prev => ({
                    ...prev,
                    [file.name]: error.response?.data?.file || error.response?.data || error?.message || 'An unexpected error occurred.'
                }));
                setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
            } finally {
                activeUploads--;
                processNextUpload();
            }
        };

        // Function to process next upload in queue
        const processNextUpload = () => {
            // If there are files in the queue and active uploads are below the max limit, start the next upload
            while (uploadQueue.length > 0 && activeUploads < MAX_CONCURRENT_UPLOADS) {
                const nextFile = uploadQueue.shift(); // Remove the first file from the queue
                activeUploads++;
                uploadFile(nextFile); // Start uploading the file
            }
        };

        try {
            for (const selectedFile of selectedFiles) {
                // Detect same name video
                const sameNameVideo = videos.some(video => video.title === selectedFile.name);
                if (sameNameVideo) {
                    // throw ({ 'response': { 'data': `File name already exists: Duplicate videos must be deleted first to be reuploaded.` } })
                    setErrorMessages(prev => ({
                        ...prev,
                        [selectedFile.name]: `File name already exists: Duplicate videos must be deleted first to be reuploaded.`
                    }));
                    setUploadStatus(prev => ({ ...prev, [selectedFile.name]: 'error' }));
                    continue;
                }
                // Skip files that have already been given feedback
                if (uploadStatus[selectedFile.name])
                    continue;

                uploadQueue.push(selectedFile);
            }
            processNextUpload();
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            // Once all files in the queue are processed, set isUploading to false
            const checkAllUploadsCompleted = setInterval(() => {
                if (uploadQueue.length === 0 && activeUploads === 0) {
                    setIsUploading(false);
                    clearInterval(checkAllUploadsCompleted);
                }
            }, 500);
        }
    }

    const handleCrop = (file) => {
        setFileToCrop(file);
        setShowCrop(true);
    }
    const handleCloseCropModal = (croppedCoordinates, success = false) => {
        setShowCrop(false);
        if (fileToCrop && success) {
            setCroppedFiles(prev => ({ ...prev, [fileToCrop.name]: true }));
            if (croppedCoordinates) {
                setFileCoordinates(prev => ({ ...prev, [fileToCrop.name]: croppedCoordinates }));
            }
        }
        setFileToCrop(null);
    }

    const allFilesCropped = selectedFiles.every(file => croppedFiles[file.name]);

    if (!show) {
        return null;
    }

    return (
        <Modal className={"upload-modal"}>
            <div className="modal-header">
                <h1 className="modal-title">Upload Media</h1>
                <Button onClick={() => { onClose(); resetModal(); }} className="back-button" disabled={isUploading} label={"X"} />
            </div>
            <input
                type="file"
                accept={allowedTypes.join(',')}
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e)}
                multiple={true}
                disabled={isUploading}
            />
            <p><sup>(File selection change needed in order to add media)</sup></p>
            {selectedFiles.length > 0 && (
                <>
                    <ul>
                        {selectedFiles.map(file => (
                            <div key={file.name} className="file-item">
                                <p className="file-name">{file.name}</p>
                                {croppedFiles[file.name] ? (
                                    <span className="cropped success">Cropped</span>
                                ) : (
                                    <span className="cropped fail">Not cropped</span>
                                )}
                                <Button className='crop-button'
                                    onClick={() => handleCrop(file)}
                                    disabled={isUploading}
                                    label={"Crop"}
                                />
                                <DeleteButton className='remove-button'
                                    onClick={() => handleRemoveFile(file)}
                                    disabled={isUploading}
                                    label={"Remove"}
                                />
                                <div className='upload-progress-bar'>
                                    <div
                                        className='upload-progress-bar-fill'
                                        style={{ width: `${uploadProgress[file.name] || 0}%` }}
                                    >
                                        <span className='upload-progress-percentage'>
                                            {uploadProgress[file.name] || 0}%
                                        </span>
                                    </div>
                                </div>
                                <div className='feedback'>
                                    {''}
                                    {uploadProgress[file.name] === 100 && !uploadStatus[file.name] && <p className="processing">Processing video...</p>}
                                    {estimatedTimeLeft[file.name] > 0 && `Estimated time left: ${Math.round(estimatedTimeLeft[file.name])} seconds`}
                                    {uploadStatus[file.name] === 'success' && (<p className="success">Upload successful!</p>)}
                                    {uploadStatus[file.name] === 'error' && (<p className="error">Upload failed: {errorMessages[file.name]}</p>)}
                                </div>
                            </div>
                        ))}
                    </ul>
                    {!allFilesCropped && <p className="alert">All files must be cropped before uploading.</p>}
                    <Button
                        className='upload-button'
                        onClick={handleUpload}
                        disabled={!allFilesCropped || isUploading}
                        label={"Upload"}
                    />
                </>
            )}

            {fileToCrop && (
                <CropModal
                    show={showCrop}
                    file={fileToCrop}
                    onClose={handleCloseCropModal}
                    resolution={[constraints.minWidth, constraints.minHeight]}
                />
            )}
        </Modal>
    );
}

export default VideoUploadModal;
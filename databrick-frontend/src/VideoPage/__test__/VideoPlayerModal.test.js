// VideoPlayerModal.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; 
import VideoPlayerModal from '../VideoPlayerModal';

describe('VideoPlayerModal Component', () => {
    const mockVideo = {
        title: 'Sample video',
        file: 'https://example.com/video.mp4',
    };

    const mockOnClose = jest.fn();

    afterEach(() => {
        jest.clearAllMocks(); 
    });

    test('Render properly when there is a video', () => {
        render(<VideoPlayerModal video={mockVideo} onClose={mockOnClose} />);

        expect(screen.getByRole('heading', { name: mockVideo.title })).toBeInTheDocument();

        const videoElement = screen.getByTestId('video-player');
        expect(videoElement).toBeInTheDocument();
        expect(videoElement).toHaveAttribute('src', mockVideo.file);
        expect(videoElement).toHaveAttribute('controls');
        expect(videoElement).toHaveAttribute('autoPlay');

        const closeButton = screen.getByRole('button', { name: /x/i });
        expect(closeButton).toBeInTheDocument();
    });

    test('Call onClose when close x', () => {
        render(<VideoPlayerModal video={mockVideo} onClose={mockOnClose} />);

        const closeButton = screen.getByRole('button', { name: /x/i });
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('should not render anything if there is not a video', () => {
        const { container } = render(<VideoPlayerModal onClose={mockOnClose} />);

        expect(container).toBeEmptyDOMElement();
    });
});

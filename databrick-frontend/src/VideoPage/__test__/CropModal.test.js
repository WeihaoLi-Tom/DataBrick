import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CropModal from '../CropModal';

describe('CropModal Component', () => {
    const mockOnClose = jest.fn();

    test('renders correctly when show is true', () => {
        render(<CropModal show={true} file={null} onClose={mockOnClose} />);
        expect(screen.getByText('Crop file')).toBeInTheDocument();
    });

    test('does not render when show is false', () => {
        render(<CropModal show={false} file={null} onClose={mockOnClose} />);
        expect(screen.queryByText('Crop file')).not.toBeInTheDocument();
    });

    test('shows invalid format message for unsupported file type', () => {
        const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
        render(<CropModal show={true} file={file} onClose={mockOnClose} />);
        expect(screen.getByText('File format must be a video or an image.')).toBeInTheDocument();
    });

    test('shows invalid resolution message when image resolution is too low', async () => {
        const file = new File(['dummy content'], 'image.png', { type: 'image/png' });
        render(<CropModal show={true} file={file} onClose={mockOnClose} />);
        
        // Mock Image
        global.Image = class {
            constructor() {
                setTimeout(() => {
                    this.width = 800;
                    this.height = 600;
                    this.onload && this.onload();
                }, 0);
            }
            set src(_) {}
        };

        await waitFor(() => {
            expect(screen.queryByText(/Resolution must be bigger than/)).not.toBeInTheDocument();
        });
    });

    test('disables crop button when format is invalid', () => {
        const file = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });
        render(<CropModal show={true} file={file} onClose={mockOnClose} />);
        const cropButton = screen.getByText('Crop');
        expect(cropButton).toBeDisabled();
    });

    test('calls onClose with null when canceling', () => {
        render(<CropModal show={true} file={null} onClose={mockOnClose} />);
        const closeButton = screen.getByText('X');
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalledWith(null);
    });
});

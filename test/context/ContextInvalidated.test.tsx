import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { ContextInvalidated } from 'src/context/ContextInvalidated';

// Mock window.location.reload
Object.defineProperty(window, 'location', {
    value: {
        reload: jest.fn(),
    },
    writable: true,
});

describe('ContextInvalidated', () => {
    beforeEach(() => {
        (window.location.reload as jest.Mock).mockClear();
    });

    it('should render the context invalidated message', () => {
        render(<ContextInvalidated />);

        expect(screen.getByText(/Context Extension Context invalidated/)).toBeInTheDocument();
        expect(screen.getByText('✕')).toBeInTheDocument();
    });

    it('should have correct styling for container', () => {
        render(<ContextInvalidated />);

        const container = screen.getByText(/Context Extension Context invalidated/).parentElement;
        expect(container).toHaveStyle({
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0',
            padding: '8px',
            fontSize: '20px',
            textAlign: 'center',
            zIndex: '999999999999',
            cursor: 'pointer',
        });
    });

    it('should apply custom className when provided', () => {
        render(<ContextInvalidated className="custom-class" />);

        const container = screen.getByText(/Context Extension Context invalidated/).parentElement;
        expect(container).toHaveClass('custom-class');
    });

    it('should reload the page when clicked', () => {
        render(<ContextInvalidated />);

        const container = screen.getByText(/Context Extension Context invalidated/);
        fireEvent.click(container);

        expect(window.location.reload).toHaveBeenCalledTimes(1);
    });

    it('should call custom onClick handler when provided', () => {
        const mockOnClick = jest.fn();
        render(<ContextInvalidated onClick={mockOnClick} />);

        const container = screen.getByText(/Context Extension Context invalidated/);
        fireEvent.click(container);

        expect(mockOnClick).toHaveBeenCalledTimes(1);
        expect(window.location.reload).not.toHaveBeenCalled();
    });

    it('should hide the component when close button is clicked', () => {
        render(<ContextInvalidated />);

        expect(screen.getByText(/Context Extension Context invalidated/)).toBeInTheDocument();

        const closeButton = screen.getByText('✕');
        fireEvent.click(closeButton);

        expect(screen.queryByText(/Context Extension Context invalidated/)).not.toBeInTheDocument();
    });

    it('should stop propagation when close button is clicked', () => {
        const mockOnClick = jest.fn();
        render(<ContextInvalidated onClick={mockOnClick} />);

        const closeButton = screen.getByText('✕');
        fireEvent.click(closeButton);

        expect(mockOnClick).not.toHaveBeenCalled();
        expect(window.location.reload).not.toHaveBeenCalled();
    });

    it('should not render when component is hidden', () => {
        render(<ContextInvalidated />);

        // Hide the component
        const closeButton = screen.getByText('✕');
        fireEvent.click(closeButton);

        // Should not render anything
        expect(screen.queryByText(/Context Extension Context invalidated/)).not.toBeInTheDocument();
        expect(screen.queryByText('✕')).not.toBeInTheDocument();
    });

    it('should have correct styling for close button', () => {
        render(<ContextInvalidated />);

        const closeButton = screen.getByText('✕');
        expect(closeButton).toHaveStyle({
            position: 'absolute',
            top: '0',
            right: '0',
            padding: '8px',
            paddingRight: '20px',
            fontSize: '20px',
            cursor: 'pointer',
        });
    });
});
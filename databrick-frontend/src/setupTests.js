// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({ legacyRoot: true });
global.URL.createObjectURL = jest.fn(() => 'mockedURL');
global.URL.revokeObjectURL = jest.fn();

class MockVideoElement {
  constructor() {
    this.videoWidth = 1920;
    this.videoHeight = 1080;
    this.addEventListener = jest.fn((event, handler) => {
      if (event === 'loadedmetadata') {
        handler();
      }
    });
    this.removeEventListener = jest.fn();
  }
}

global.HTMLVideoElement = MockVideoElement;

jest.mock('react-easy-crop', () => (props) => {
  return (
    <div data-testid="react-easy-crop">
      {/* Mock Cropper if neede*/}
    </div>
  );
});

jest.mock('react-dnd', () => ({
    DndProvider: ({ children }) => <div>{children}</div>,
    useDrag: () => [{
      isDragging: false,
      drag: jest.fn(),
    }, jest.fn()],
    useDrop: () => [{
      isOver: false,
      canDrop: false,
      drop: jest.fn(),
    }, jest.fn()],
  }));
  
  jest.mock('react-dnd-html5-backend', () => ({
    HTML5Backend: {},
  }));

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: jest.fn(),
  }));

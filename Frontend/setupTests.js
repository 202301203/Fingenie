// setupTests.js

import '@testing-library/jest-dom';
import 'jest-fetch-mock';

// Enable fetch mocks globally
fetchMock.enableMocks();

// You may also need to mock image imports if not using create-react-app:
// jest.mock('../images/fglogo_Wbg.png', () => 'fglogo_Wbg.png');
// jest.mock('../images/Glogo.png', () => 'Glogo.png');

// Mock the external CSS import
jest.mock('../App.css', () => ({}));
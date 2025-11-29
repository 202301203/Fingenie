import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizPage from '../Wordoftheday'; 

const MOCK_API_KEY = 'mock-test-key-123';

const MOCK_QUIZ_DATA = {
    term: 'Fiscal Policy',
    date: 'November 24, 2025',
    explanation: 'Fiscal policy refers to the use of government spending and taxation to influence the economy. It is managed by the executive and legislative branches of the government.',
    question: 'Which of the following is a tool of Fiscal Policy?',
    options: [
        'A. Changing the Federal Funds Rate',
        'B. Government Spending',
        'C. Open Market Operations',
        'D. Adjusting Reserve Requirements'
    ],
    correct_answer: 'B. Government Spending',
    answer_explanation: 'Government Spending (and taxation) are the two primary tools of fiscal policy. The other options are tools of Monetary Policy, managed by the Central Bank.',
};


const mockFetch = jest.fn();
global.fetch = mockFetch;


const mockSuccessfulFetch = (data = MOCK_QUIZ_DATA) => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
        ok: true,
        json: async () => data,
    });
};

const mockFailedFetch = (status = 500, errorMsg = { error: 'Server error' }) => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
        ok: false,
        status: status,
        json: async () => errorMsg,
    });
};


const localStorageMock = {
    getItem: jest.fn(key => {
        if (key === 'userApiKey') return MOCK_API_KEY;
        return null;
    }),
    setItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/wordoftheday', search: '', hash: '', state: null }),
}));

jest.mock('../../components/Header', () => () => <div data-testid="mock-header">Mock Header</div>);
jest.mock('../../components/Footer', () => () => <div data-testid="mock-footer">Mock Footer</div>);

jest.mock('lucide-react', () => {
    const original = jest.requireActual('lucide-react');
    const mockIcons = {};
    for (const key in original) {
        if (typeof original[key] === 'function') {
            mockIcons[key] = (props) => <svg data-testid={`icon-${key}`} {...props} />;
        }
    }
    return {
        ...mockIcons,
    };
});


describe('QuizPage Component (Wordoftheday.jsx)', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(MOCK_API_KEY);
        mockSuccessfulFetch();
    });
    
    //1.
    test('1.Show loading state and then render content on successful fetch', async () => {
        render(<QuizPage />);

        expect(screen.getByText(/Loading today's topic.../i)).toBeInTheDocument();

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(mockFetch).toHaveBeenCalledWith(
                'https://fingenie-sz41.onrender.com/api/learning/daily-topic/',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ api_key: MOCK_API_KEY })
                })
            );
        });

        expect(await screen.findByText(MOCK_QUIZ_DATA.term)).toBeInTheDocument();
        expect(screen.getByText(MOCK_QUIZ_DATA.question)).toBeInTheDocument();
        expect(screen.getByText(MOCK_QUIZ_DATA.explanation)).toBeInTheDocument();
        expect(screen.queryByText(/Loading today's topic.../i)).not.toBeInTheDocument();
    });

    //2.
    test('2.Display error state if API Key is missing from localStorage', async () => {
        localStorageMock.getItem.mockReturnValue(null);
        render(<QuizPage />);

        expect(await screen.findByText(/API Key not found./i)).toBeInTheDocument();
        expect(screen.getByText(/Unable to load content/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
        expect(mockFetch).not.toHaveBeenCalled();
    });
    
    //3.
    test('3.Display API error state on fetch failure', async () => {
        mockFailedFetch(500, { error: 'Rate limit exceeded' });
        render(<QuizPage />);

        expect(await screen.findByText(/Failed to load today's topic./i)).toBeInTheDocument();
        expect(screen.getByText(/Unable to load content/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
        expect(screen.queryByText(MOCK_QUIZ_DATA.term)).not.toBeInTheDocument();
    });
    
    //4.
    test('4.Display error message when submitting without selecting an option', async () => {
        render(<QuizPage />);
        await screen.findByText(MOCK_QUIZ_DATA.term);

        const submitButton = screen.getByRole('button', { name: /Submit Answer/i });
        await user.click(submitButton);

        expect(screen.getByText(/⚠️ Please select an option before submitting the quiz./i)).toBeInTheDocument();
        
        await user.click(screen.getByText(MOCK_QUIZ_DATA.options[0]));
        expect(screen.queryByText(/⚠️ Please select an option before submitting the quiz./i)).not.toBeInTheDocument();
    });
    
    //5.
    test('5.Display correct result on correct answer submission', async () => {
        render(<QuizPage />);
        await screen.findByText(MOCK_QUIZ_DATA.term);
        await user.click(screen.getByText(MOCK_QUIZ_DATA.correct_answer));
        const submitButton = screen.getByRole('button', { name: /Submit Answer/i });
        await user.click(submitButton);

        expect(screen.getByText('✅ Correct Answer!')).toBeInTheDocument();
        expect(screen.getByText(/Retry Quiz/i)).toBeInTheDocument();
        
        expect(screen.getByText(MOCK_QUIZ_DATA.answer_explanation)).toBeInTheDocument();
        
        const correctOptionElement = screen.getByText(MOCK_QUIZ_DATA.correct_answer, { selector: 'div' });
        expect(correctOptionElement).toHaveStyle('font-weight: bold');
    });
   
    //6.
    test('6.Display incorrect result on incorrect answer submission', async () => {
        render(<QuizPage />);
        await screen.findByText(MOCK_QUIZ_DATA.term);

        const incorrectOption = MOCK_QUIZ_DATA.options.find(opt => opt !== MOCK_QUIZ_DATA.correct_answer);

        await user.click(screen.getByText(incorrectOption));
        const submitButton = screen.getByRole('button', { name: /Submit Answer/i });
        await user.click(submitButton);

        expect(screen.getByText('❌ Incorrect. Try Again!')).toBeInTheDocument();

        expect(screen.getByText(/The Correct Answer Was:/i)).toBeInTheDocument();
        
        const explanationContainer = screen.getByText(/The Correct Answer Was:/i).closest('p');
        expect(explanationContainer).toHaveTextContent(MOCK_QUIZ_DATA.correct_answer);
        expect(screen.getByText(incorrectOption)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry Quiz/i })).toBeInTheDocument();
    });
    
    //7.
    test('7.Reset the quiz state when Retry Quiz is clicked', async () => {
        render(<QuizPage />);
        await screen.findByText(MOCK_QUIZ_DATA.term);
        await user.click(screen.getByText(MOCK_QUIZ_DATA.correct_answer));
        await user.click(screen.getByRole('button', { name: /Submit Answer/i }));

        expect(screen.getByText('✅ Correct Answer!')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Retry Quiz/i }));
        expect(screen.queryByText('✅ Correct Answer!')).not.toBeInTheDocument();
        expect(screen.queryByText(MOCK_QUIZ_DATA.answer_explanation)).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Submit Answer/i })).toBeInTheDocument();
    });
});
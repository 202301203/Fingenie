import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ComparisonPage from '../pages/comparison';

jest.mock('lucide-react', () => ({
  Upload: (props) => <div data-testid="upload-icon" {...props}>Upload</div>,
  FileText: (props) => <div data-testid="filetext-icon" {...props}>FileText</div>,
  RefreshCw: (props) => <div data-testid="refresh-icon" {...props}>RefreshCw</div>,
  CheckCircle: (props) => <div data-testid="check-icon" {...props}>CheckCircle</div>,
  Home: (props) => <div data-testid="home-icon" {...props}>Home</div>,
  Scale: (props) => <div data-testid="scale-icon" {...props}>Scale</div>,
}), { virtual: true });

const mockNavigate = jest.fn();
const mockLocation = { pathname: '/comparison', state: null };
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

jest.mock('../components/Header', () => function Header() { return <div data-testid="header">Header</div>; });
jest.mock('../components/Footer', () => function Footer() { return <div data-testid="footer">Footer</div>; });

// Mock data for comparison edge cases
const mockComparisonDataWithInvalidValues = {
  company1: { company_name: "Test Co 1", fiscal_year_end: "2025-03-31", currency: "INR" },
  company2: { company_name: "Test Co 2", fiscal_year_end: "2025-03-31", currency: "INR" },
  comparison: {
    verdict: "invalid_verdict",
    score: { "Test Co 1": 1, "Test Co 2": 0 },
    summary: "Test summary",
    comparisons: [
      { metric: "test_metric", winner: "invalid_winner", preference: "invalid_pref", company1_value: 100, company2_value: 200 },
      { metric: "another_metric", winner: "unknown", preference: "sideways", company1_value: 50, company2_value: 75 },
    ],
    labels: { company1: "Test Co 1", company2: "Test Co 2" }
  }
};

const renderComparisonPage = () => render(<BrowserRouter><ComparisonPage /></BrowserRouter>);
const createMockFile = (name, size = 1024, type = 'application/pdf') => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const uploadFile = (fileNumber, fileName, size) => {
  const input = document.getElementById(`file${fileNumber}`);
  fireEvent.change(input, { target: { files: [createMockFile(fileName, size)] } });
};

const expectText = (text) => expect(screen.getByText(text)).toBeInTheDocument();
const expectNoText = (text) => expect(screen.queryByText(text)).not.toBeInTheDocument();

describe('Comparison page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('1 - Initial UI and disabled state', () => {
    renderComparisonPage();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expectText('Company Financial Comparison');
    expectText('Upload Two Financial Documents');
    expectText(/Upload File 1 \(Company A\)/i);
    expectText(/Upload File 2 \(Company B\)/i);
    expectText(/Please upload two distinct files/i);
    expectText(/LLM API Key \(optional\)/i);
    expect(screen.getByPlaceholderText(/Paste API key here/i)).toBeInTheDocument();
    expect(screen.getByText(/how to get API key/i)).toBeInTheDocument();
    expect(document.getElementById('file1')).toBeInTheDocument();
    expect(document.getElementById('file2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Compare Companies/i })).toBeDisabled();
  });

  test('2 - File uploads and button states', () => {
    renderComparisonPage();
    const compareBtn = screen.getByRole('button', { name: /Compare Companies/i });
    expect(compareBtn).toBeDisabled();
    
    uploadFile(1, 'company1.pdf');
    expectText('File 1 Uploaded');
    expectText('company1.pdf');
    expect(compareBtn).toBeDisabled();
    
    uploadFile(2, 'company2.pdf');
    expectText('File 2 Uploaded');
    expectText('company2.pdf');
    expect(compareBtn).not.toBeDisabled();
    
    // Replace uploaded file1
    uploadFile(1, 'new.pdf');
    expectText('new.pdf');
    expectNoText('company1.pdf');
    expectText('File 1 Uploaded');
    expect(compareBtn).not.toBeDisabled();
  });

  test('3 - File size validation and persistence', () => {
    renderComparisonPage();
    
    uploadFile(1, 'large.pdf', 25 * 1024 * 1024);
    expectText(/exceeds the 20MB limit/i);
    
    uploadFile(1, 'valid.pdf');
    expectNoText(/exceeds the 20MB limit/i);
    expectText('File 1 Uploaded');
    
    // Persisting error on invalid uploads
    const largeFile = createMockFile('huge.pdf', 25 * 1024 * 1024);
    fireEvent.change(document.getElementById('file1'), { target: { files: [largeFile] } });
    expectText(/exceeds the 20MB limit/i);
  });

  test('4 - Prevent duplicate uploads', () => {
    renderComparisonPage();
    
    // Upload same file object to both inputs
    const sameFile = createMockFile('same.pdf');
    fireEvent.change(document.getElementById('file1'), { target: { files: [sameFile] } });
    fireEvent.change(document.getElementById('file2'), { target: { files: [sameFile] } });
    expectText(/Cannot upload duplicate files/i);
    expect(screen.getByRole('button', { name: /Compare Companies/i })).toBeDisabled();
    
    // Different objects with same name+size
    const identicalFile1 = createMockFile('duplicate.pdf', 8000);
    const identicalFile2 = createMockFile('duplicate.pdf', 8000);
    fireEvent.change(document.getElementById('file1'), { target: { files: [identicalFile1] } });
    fireEvent.change(document.getElementById('file2'), { target: { files: [identicalFile2] } });
    expectText(/Cannot upload duplicate files/i);
  });

  test('5 - API key input and navigation', () => {
    renderComparisonPage();
    const apiKeyInput = screen.getByPlaceholderText(/Paste API key here/i);
    
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key-123' } });
    expect(apiKeyInput.value).toBe('test-api-key-123');
    
    fireEvent.change(apiKeyInput, { target: { value: '' } });
    expect(apiKeyInput.value).toBe('');
    
    fireEvent.click(screen.getByText(/how to get API key/i));
    expect(mockNavigate).toHaveBeenCalledWith('/API_key');
  });

  test('6 - Submit comparison and results', async () => {
    renderComparisonPage();
    uploadFile(1, 'company1.pdf');
    uploadFile(2, 'company2.pdf');
    
    const compareBtn = screen.getByRole('button', { name: /Compare Companies/i });
    fireEvent.click(compareBtn);
    
    expectText(/Analyzing.../i);
    expect(compareBtn).toBeDisabled();
    
    jest.advanceTimersByTime(2000);
    await waitFor(() => expectText(/VERDICT: TIE/i));
    expectText(/Both companies performed similarly/i);
    expectText(/Metric Comparison Breakdown/i);
    expectText(/Total Assets/i);
    expectText(/Debt Ratio/i);
  });

  test('7 - Formatted results display', async () => {
    renderComparisonPage();
    uploadFile(1, 'company1.pdf');
    uploadFile(2, 'company2.pdf');
    
    fireEvent.click(screen.getByRole('button', { name: /Compare Companies/i }));
    jest.advanceTimersByTime(2000);
    
    await waitFor(() => expectText(/VERDICT: TIE/i));
    expect(screen.getAllByText(/INR 1.49T/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/higher is better/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/lower is better/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tie/i).length).toBeGreaterThan(0);
  });

  test('8 - Reset state for new comparison', async () => {
    renderComparisonPage();
    uploadFile(1, 'company1.pdf');
    uploadFile(2, 'company2.pdf');
    
    fireEvent.click(screen.getByRole('button', { name: /Compare Companies/i }));
    jest.advanceTimersByTime(2000);
    
    await waitFor(() => expectText(/VERDICT: TIE/i));
    
    fireEvent.click(screen.getByRole('button', { name: /Compare New Files/i }));
    expectText('Upload Two Financial Documents');
    expectNoText(/VERDICT: TIE/i);
    expectNoText('company1.pdf');
    expectNoText('company2.pdf');
  });

  test('9 - UI interactions and mouse events', async () => {
    renderComparisonPage();
    uploadFile(1, 'company1.pdf');
    uploadFile(2, 'company2.pdf');
    
    const compareBtn = screen.getByRole('button', { name: /Compare Companies/i });
    fireEvent.mouseEnter(compareBtn);
    fireEvent.mouseLeave(compareBtn);
    fireEvent.click(compareBtn);
    
    jest.advanceTimersByTime(2000);
    await waitFor(() => expectText(/Total Assets/i));
    
    const tableRows = screen.getAllByRole('row');
    const dataRow = tableRows.find(row => row.textContent.includes('Total Assets'));
    if (dataRow) {
      fireEvent.mouseEnter(dataRow);
      fireEvent.mouseLeave(dataRow);
    }
  });

  test('10 - Multiple file types and sizes', async () => {
    renderComparisonPage();
    
    const input1 = screen.getByLabelText(/Upload File 1/i);
    const input2 = screen.getByLabelText(/Upload File 2/i);
    
    fireEvent.change(input1, { target: { files: [createMockFile('company1.pdf', 1024, 'application/pdf')] } });
    fireEvent.change(input2, { target: { files: [createMockFile('company2.xlsx', 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')] } });
    expectText('company1.pdf');
    expectText('company2.xlsx');
    
    // Same filename, different sizes allowed
    fireEvent.change(input1, { target: { files: [createMockFile('report.pdf', 1024)] } });
    fireEvent.change(input2, { target: { files: [createMockFile('report.pdf', 2048)] } });
    expectNoText(/Cannot upload duplicate files/i);
    
    fireEvent.click(screen.getByRole('button', { name: /Compare Companies/i }));
    jest.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(screen.queryByText(/Current Ratio/i)).not.toBeInTheDocument();
    });
  });

  test('11 - Same filename different sizes allowed', async () => {
    renderComparisonPage();
    
    uploadFile(1, 'company_a.pdf', 5000);
    expect(screen.getAllByText('company_a.pdf').length).toBeGreaterThan(0);
    
    uploadFile(2, 'company_a.pdf', 6000);
    expect(screen.getAllByText('company_a.pdf').length).toBe(2);
    
    const compareBtn = screen.getByRole('button', { name: /Compare Companies/i });
    fireEvent.click(compareBtn);
    
    jest.advanceTimersByTime(2000);
    await waitFor(() => expectText(/VERDICT: TIE/i));
  });

  test('12 - Comprehensive comparison results', async () => {
    renderComparisonPage();
    
    uploadFile(1, 'file1.pdf', 3000);
    uploadFile(2, 'file2.pdf', 4000);
    
    fireEvent.click(screen.getByRole('button', { name: /Compare Companies/i }));
    jest.advanceTimersByTime(2000);
    
    // Verify all parts of the results are displayed
    await waitFor(() => {
      expectText(/VERDICT: TIE/i);
      expectText(/Both companies performed similarly/i);
      expectText(/Metric Comparison Breakdown/i);
      
      // Check that various metrics are present
      expect(screen.queryByText(/Total Assets/i)).toBeInTheDocument();
      expect(screen.queryByText(/Debt Ratio/i)).toBeInTheDocument();
      
      // Verify preference icons are rendered
      expect(screen.getAllByText(/higher is better/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/lower is better/i).length).toBeGreaterThan(0);
      
      // Verify winner labels
      expect(screen.getAllByText(/Tie/i).length).toBeGreaterThan(0);
      
      // Verify formatted numbers
      expect(screen.getAllByText(/INR 1.49T/i).length).toBeGreaterThan(0);
    });
  });
});


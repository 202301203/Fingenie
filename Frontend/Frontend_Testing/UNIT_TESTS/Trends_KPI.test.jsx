import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

jest.mock('lucide-react', () => {
  const icons = ['TrendingUp', 'TrendingDown', 'AlertTriangle', 'FileText', 'Search', 'X', 'Upload', 'CheckCircle', 'XCircle', 'ArrowUpDown', 'User', 'LogOut', 'History', 'Settings', 'Wrench', 'BarChart', 'Activity', 'BookOpen', 'Cpu', 'GitCompare', 'UploadCloud'];
  const mocks = {};
  icons.forEach(icon => {
    mocks[icon] = (props) => <div data-testid={`${icon.toLowerCase()}-icon`} {...props} />;
  });
  return mocks;
}, { virtual: true });

// Use real recharts components

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

jest.mock('../components/Header', () => function Header() {
  return <div data-testid="header">Header</div>;
});

jest.mock('../components/Footer', () => function Footer() {
  return <div data-testid="footer">Footer</div>;
});

const { default: AppFlow, formatValue, formatFileSize, getTrendIcon, getQualityStyle, getGrowthColor } = require('../pages/Trends_KPI');

const renderApp = () => render(<BrowserRouter><AppFlow /></BrowserRouter>);
const createMockFile = (name, size = 1024, type = 'application/pdf') => {
  const file = new File(['test'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};
const uploadFiles = (files) => {
  const input = document.getElementById('file-input');
  fireEvent.change(input, { target: { files } });
};

describe('Trends_KPI page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('1 - File upload validation, API key and dashboard', async () => {
    renderApp();
    
    // File type validation
    uploadFiles([createMockFile('invalid.txt', 1024, 'text/plain')]);
    expect(screen.getByText(/has unsupported format/i)).toBeInTheDocument();
    
    // File size validation
    uploadFiles([createMockFile('huge.pdf', 25 * 1024 * 1024)]);
    expect(screen.getByText(/huge\.pdf.*exceeds.*20MB/i)).toBeInTheDocument();
    
    // File removal
    uploadFiles([createMockFile('test.pdf', 1024)]);
    const removeBtns = screen.getAllByTestId('xcircle-icon');
    if (removeBtns.length > 0) fireEvent.click(removeBtns[0].parentElement);
    
    // API key & dashboard test
    const mockData = {
      success: true,
      trends: {
        financial_trends: [
          { metric: 'Zebra', trend_direction: 'strongly increasing', growth_rate: 25.5, importance_score: 3, data_quality: 'excellent', values: [{ year: 2023, value: 1.5e12, formatted_value: '1.50T' }, { year: 2024, value: 1.8e12, formatted_value: '1.80T' }], analysis: { trend_description: 'High', key_insights: ['A', 'B'] }},
          { metric: 'Alpha', trend_direction: 'decreasing', growth_rate: -15.5, importance_score: 9, data_quality: 'poor', values: [{ year: 2023, value: -5e6, formatted_value: '-5.00M' }], analysis: { trend_description: 'Low', key_insights: ['C'] }},
          { metric: 'Mid', trend_direction: 'stable', growth_rate: 0.1, importance_score: 6, data_quality: 'fair', values: [{ year: 2023, value: 150, formatted_value: '150.00' }], analysis: { trend_description: 'Med', key_insights: [] }}
        ]
      },
      summary: { 
        overall_assessment: 'Mixed trends', 
        files_processed: 1, 
        total_metrics_found: 3, 
        critical_metrics_analyzed: 3,
        executive_summary: {
          key_strengths: ['Strength 1'],
          key_concerns: ['Concern 1'],
          recommendations: ['Rec 1']
        }
      },
      metadata: { company_name: 'TestCo' }
    };

    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });

    uploadFiles([createMockFile('f1.pdf'), createMockFile('f2.pdf'), createMockFile('f3.pdf')]);
    const apiInput = screen.getByPlaceholderText(/Paste API key here/i);
    fireEvent.change(apiInput, { target: { value: 'key' } });
    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));

    await waitFor(() => expect(screen.getAllByText(/TestCo/i)[0]).toBeInTheDocument());
    
    // Verify dashboard content
    expect(screen.getAllByText(/Zebra/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/25\.50%/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/poor/i)[0]).toBeInTheDocument();
    
    // Test search
    const searchInput = screen.getByPlaceholderText(/Search metrics/i);
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });
    await waitFor(() => expect(screen.queryByText('Zebra')).not.toBeInTheDocument());
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // Test sorting
    const metricHeaders = screen.getAllByText(/^Metric/);
    const metricHeader = metricHeaders.find(el => el.tagName === 'TH');
    if (metricHeader) {
      fireEvent.click(metricHeader); // sort desc
      fireEvent.click(metricHeader); // sort asc
    }
    
    const growthHeaders = screen.getAllByText(/Growth Rate/i);
    const growthHeader = growthHeaders.find(el => el.tagName === 'TH');
    if (growthHeader) {
      fireEvent.click(growthHeader);
      fireEvent.click(growthHeader);
    }
    
    const importanceHeaders = screen.getAllByText(/Importance/i);
    const importanceHeader = importanceHeaders.find(el => el.tagName === 'TH');
    if (importanceHeader) {
      fireEvent.click(importanceHeader);
      fireEvent.click(importanceHeader);
    }
    
    // Test metric selection
    const metricRow = screen.getAllByText('Alpha')[0].closest('tr');
    fireEvent.click(metricRow);
    await waitFor(() => expect(screen.getAllByText(/Annual Growth Rate/i)[0]).toBeInTheDocument());
    
    // Test back navigation
    const backButton = screen.getByTestId('x-icon').closest('button');
    fireEvent.click(backButton);
    await waitFor(() => expect(screen.getByText(/Upload Financial Documents/i)).toBeInTheDocument());
  });

  test('2 - API errors, HTTP errors and processing state', async () => {
    renderApp();
    
    // Test network error
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    uploadFiles([createMockFile('f1.pdf'), createMockFile('f2.pdf'), createMockFile('f3.pdf')]);
    const apiInput = screen.getByPlaceholderText(/Paste API key here/i);
    fireEvent.change(apiInput, { target: { value: 'key' } });
    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));
    await waitFor(() => expect(screen.getByText(/upload failed/i)).toBeInTheDocument(), { timeout: 3000 });
  });

  test('3 - Edge cases null values and data qualities', async () => {
    renderApp();
    
      // Test drag and drop
      const dropZone = screen.getByText(/drag & drop/i).closest('div');
      fireEvent.dragOver(dropZone);
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [createMockFile('drop.pdf')] }
      });
    
    const mockData = {
      success: true,
      trends: {
        financial_trends: [
          { metric: 'NullTest', trend_direction: 'stable', growth_rate: null, importance_score: 5, data_quality: 'excellent', values: [{ year: 2023, value: null, formatted_value: 'N/A' }], analysis: { trend_description: 'Test', key_insights: [] }},
            { metric: 'StrongDown', trend_direction: 'strongly decreasing', growth_rate: -25, importance_score: 8, data_quality: 'fair', values: [{ year: 2023, value: -1e9, formatted_value: '-1.00B' }], analysis: { trend_description: 'Strong decline', key_insights: ['Concern'] }},
          { metric: 'EstTest', trend_direction: 'increasing', growth_rate: 5, importance_score: 7, data_quality: 'estimated', values: [{ year: 2023, value: 100, formatted_value: '100' }], analysis: { trend_description: 'Est', key_insights: ['A'] }},
          { metric: 'UnknownTest', trend_direction: 'decreasing', growth_rate: -3, importance_score: 4, data_quality: 'unknown', values: [{ year: 2023, value: 50, formatted_value: '50' }], analysis: { trend_description: 'Unk', key_insights: ['B'] }}
        ]
      },
      summary: { overall_assessment: 'Edge cases', files_processed: 1, total_metrics_found: 3, critical_metrics_analyzed: 3 },
      metadata: { company_name: 'EdgeCo' }
    };

    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
    uploadFiles([createMockFile('f1.pdf'), createMockFile('f2.pdf'), createMockFile('f3.pdf')]);
    const apiInput = screen.getByPlaceholderText(/Paste API key here/i);
    fireEvent.change(apiInput, { target: { value: 'key' } });
    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));

    await waitFor(() => expect(screen.getAllByText(/EdgeCo/i)[0]).toBeInTheDocument());
    expect(screen.getAllByText(/estimated/i)[0]).toBeInTheDocument();
  });

  test('4 - Validation + error branches and empty yearly data', async () => {
    renderApp();

    // Upload fewer than MIN_FILES (1 file) -> expect min files message
    uploadFiles([createMockFile('onlyone.pdf')]);
    expect(screen.getByText(/Please upload at least 2 more file\(s\)/i)).toBeInTheDocument();

    // Duplicate file attempt (same name & size) should not increase count beyond 1
    uploadFiles([createMockFile('onlyone.pdf')]);
    const uploadedHeader = screen.getByText(/Uploaded Files/);
    expect(uploadedHeader.textContent).toMatch(/\(1 \/ 10\)/); // still 1

    // Exceed max files: attempt 11 distinct files
    const manyFiles = Array.from({ length: 11 }, (_, i) => createMockFile(`file${i}.pdf`));
    uploadFiles(manyFiles);
    // Should cap at 10 and show max error
    expect(screen.getByText(/maximum of 10 files/i)).toBeInTheDocument();
    expect(screen.getByText(/Uploaded Files \(10 \/ 10\)/)).toBeInTheDocument();

    // Remove a file -> triggers min files remaining validation when <3 after removals
    // Remove files until only 2 remain (dynamic to avoid stale node references)
    let currentRemoveBtns = screen.getAllByTestId('xcircle-icon');
    while (currentRemoveBtns.length > 2) {
      fireEvent.click(currentRemoveBtns[0].parentElement);
      currentRemoveBtns = screen.queryAllByTestId('xcircle-icon');
    }
    // Should now show prompt for 1 more file
    expect(screen.getByText(/Please upload at least 1 more file\(s\)/i)).toBeInTheDocument();

    // Add valid 3rd file to satisfy MIN_FILES
    uploadFiles([createMockFile('third.pdf')]);
    expect(screen.queryByText(/Please upload at least 1 more file\(s\)/i)).not.toBeInTheDocument();

    // Success false response branch
    const apiInput = screen.getByPlaceholderText(/Paste API key here/i);
    fireEvent.change(apiInput, { target: { value: 'apikey123' } });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, error: 'Bad processing' })
    });

    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));
    await waitFor(() => expect(screen.getByText(/Upload failed: Bad processing/i)).toBeInTheDocument());

    // HTTP error + non-JSON body fallback branch
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: async () => 'Internal Server Error'
    });
    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));
    await waitFor(() => expect(screen.getByText(/Upload failed: HTTP 500: Server Error/i)).toBeInTheDocument());

    // Successful upload with a metric that has empty yearly_values (chart empty branch)
    const successData = {
      success: true,
      trends: {
        financial_trends: [
          { metric: 'NoDataMetric', trend_direction: 'increasing', growth_rate: 10, importance_score: 5, data_quality: 'excellent', yearly_values: {}, interpretation: 'None', indication: 'None' },
          { metric: 'BigNumberMetric', trend_direction: 'increasing', growth_rate: 12.34, importance_score: 7, data_quality: 'fair', yearly_values: { 2020: 1500, 2021: 1.2e6, 2022: 2.3e9, 2023: 4.5e12 }, interpretation: 'Large scale', indication: 'Expanding' },
          { metric: 'ZeroGrowth', trend_direction: 'stable', growth_rate: 0, importance_score: 3, data_quality: 'poor', yearly_values: { 2021: 100, 2022: 100 }, interpretation: 'Flat', indication: 'Neutral' },
          { metric: 'UnknownDir', trend_direction: 'mystery', growth_rate: -1, importance_score: 2, data_quality: 'unknown', yearly_values: { 2023: 50 }, interpretation: 'Odd', indication: 'Check' }
        ]
      },
      summary: { overall_assessment: 'Mixed', files_processed: 3, total_metrics_found: 4, critical_metrics_analyzed: 4 },
      metadata: { company_name: 'ChartCo' }
    };

    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => successData });
    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));

    await waitFor(() => expect(screen.getByText(/ChartCo/i)).toBeInTheDocument());
    // Select NoDataMetric to trigger empty yearly data branch (message excluded from coverage)
    fireEvent.click(screen.getByText('NoDataMetric'));

    // Select BigNumberMetric to exercise growth color & large number formatting path (even though recharts mocked)
    fireEvent.click(screen.getByText('BigNumberMetric'));
    expect(screen.getByText(/Annual Growth Rate/i)).toBeInTheDocument();
    // Select UnknownDir to exercise default trend icon branch
    fireEvent.click(screen.getByText('UnknownDir'));
    expect(screen.getByText(/mystery/i)).toBeInTheDocument();
  });

  test('5 - Utility formatValue & formatFileSize extremes', () => {
    expect(formatValue(null)).toBe('N/A');
    expect(formatValue(1.234e12)).toBe('1.23T');
    expect(formatValue(5.6e9)).toBe('5.60B');
    expect(formatValue(7.89e6)).toBe('7.89M');
    expect(formatValue(12345)).toBe('12.35K');
    expect(formatValue(-987.654)).toBe('-987.65');
    expect(formatValue('raw')).toBe('raw');
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  test('6 - Utility icon & style helpers', () => {
    // Trend icons
    const incIcon = getTrendIcon('increasing');
    const strIncIcon = getTrendIcon('strongly increasing');
    const decIcon = getTrendIcon('decreasing');
    const strDecIcon = getTrendIcon('strongly decreasing');
    const stableIcon = getTrendIcon('stable');
    const unknownIcon = getTrendIcon('unseen');
    [incIcon, strIncIcon, decIcon, strDecIcon, stableIcon, unknownIcon].forEach(el => {
      expect(el.props.children[0]).toBeDefined();
    });
    // Quality styles
    expect(getQualityStyle('excellent').color).toBe('#28a745');
    expect(getQualityStyle('fair').color).toBe('#333');
    expect(getQualityStyle('estimated').color).toBe('#333');
    expect(getQualityStyle('poor').color).toBe('#dc3545');
    expect(getQualityStyle('unknown').padding).toBeDefined();
    // Growth color
    expect(getGrowthColor(5)).toBe('#28a745');
    expect(getGrowthColor(-3)).toBe('#dc3545');
    expect(getGrowthColor(0)).toBe('#6c757d');
  });

  test('7 - Fallback page when initialPage invalid', () => {
    render(<BrowserRouter><AppFlow initialPage="mystery" /></BrowserRouter>);
    expect(screen.getByText(/Loading application/i)).toBeInTheDocument();
  });

  test('8 - Additional utility extremes and file sizes', () => {
    expect(formatValue(-2.5e12)).toBe('2.50T'); // abs large negative
    expect(formatValue(42)).toBe('42.00'); // no magnitude suffix
    // File sizes
    const onePointFiveKB = 1536; // ~1.50 KB (binary rounding)
    const twoMB = 2 * 1024 * 1024; // 2 MB
    expect(formatFileSize(onePointFiveKB)).toBe('1.5 KB');
    expect(formatFileSize(twoMB)).toBe('2 MB');
  });

  test('9 - Row hover styling and selection highlight', async () => {
    renderApp();
    const mockData = {
      success: true,
      trends: { financial_trends: [
        { metric: 'First', trend_direction: 'increasing', growth_rate: 10, importance_score: 1, data_quality: 'excellent', yearly_values: { 2023: 10 }, interpretation: 'Good', indication: 'Positive' },
        { metric: 'Second', trend_direction: 'stable', growth_rate: 0, importance_score: 2, data_quality: 'fair', yearly_values: { 2023: 5 }, interpretation: 'Flat', indication: 'Neutral' },
        { metric: 'Third', trend_direction: 'decreasing', growth_rate: -5, importance_score: 3, data_quality: 'poor', yearly_values: { 2023: 2 }, interpretation: 'Down', indication: 'Risk' }
      ] },
      summary: { overall_assessment: 'Test', files_processed: 3, total_metrics_found: 3, critical_metrics_analyzed: 3 },
      metadata: { company_name: 'HoverRowsCo' }
    };
    uploadFiles([createMockFile('a.pdf'), createMockFile('b.pdf'), createMockFile('c.pdf')]);
    fireEvent.change(screen.getByPlaceholderText(/Paste API key here/i), { target: { value: 'key' } });
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));
    await waitFor(() => screen.getByText(/HoverRowsCo/));
    const secondRowCell = screen.getAllByText('Second')[0];
    const secondRow = secondRowCell.closest('tr');
    fireEvent.mouseEnter(secondRow);
    expect(secondRow).toHaveStyle('background-color: #f0f0f0');
    // Select Third row to activate selection color
    const thirdRowCell = screen.getAllByText('Third')[0];
    const thirdRow = thirdRowCell.closest('tr');
    fireEvent.click(thirdRow);
    await waitFor(() => expect(thirdRow).toHaveStyle('background-color: #e6f7ff'));
  });

  test('10 - Executive summary fallback messages when arrays empty', async () => {
    renderApp();
    const mockData = {
      success: true,
      trends: { financial_trends: [ { metric: 'FallbackMetric', trend_direction: 'stable', growth_rate: 0, importance_score: 1, data_quality: 'fair', yearly_values: { 2023: 100 }, interpretation: 'Neutral', indication: 'Hold' } ] },
      summary: {
        overall_assessment: 'Needs review',
        files_processed: 1,
        total_metrics_found: 1,
        critical_metrics_analyzed: 1,
        executive_summary: {
          key_strengths: [],
          major_concerns: [],
          strategic_recommendations: []
        }
      },
      metadata: { company_name: 'FallbackCo' }
    };
    uploadFiles([createMockFile('a.pdf'), createMockFile('b.pdf'), createMockFile('c.pdf')]);
    fireEvent.change(screen.getByPlaceholderText(/Paste API key here/i), { target: { value: 'key' } });
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));
    await waitFor(() => screen.getByText(/FallbackCo/i));
    expect(screen.getByText(/No significant strengths noted/i)).toBeInTheDocument();
    expect(screen.getByText(/No major concerns noted/i)).toBeInTheDocument();
    expect(screen.getByText(/No specific recommendations/i)).toBeInTheDocument();
  });

  test('11 - Summary fallback for missing assessment and exec summary', async () => {
    renderApp();
    const mockData = {
      success: true,
      trends: { financial_trends: [
        { metric: 'TieA', trend_direction: 'stable', growth_rate: 5, importance_score: 2, data_quality: 'excellent', yearly_values: { 2022: 200 }, interpretation: 'Ok', indication: 'Neutral' },
        { metric: 'TieB', trend_direction: 'stable', growth_rate: 5, importance_score: 3, data_quality: 'fair', yearly_values: { 2022: 200 }, interpretation: 'Ok', indication: 'Neutral' },
        { metric: 'Different', trend_direction: 'increasing', growth_rate: 10, importance_score: 4, data_quality: 'poor', yearly_values: { 2022: 300 }, interpretation: 'Up', indication: 'Positive' }
      ] },
      summary: {
        overall_assessment: null,
        focus: 'profitability_focus',
        files_processed: 1,
        total_metrics_found: 3,
        critical_metrics_analyzed: 3
        // executive_summary intentionally omitted
      },
      metadata: { file_summaries: [{ company_name: 'TieCo' }] }
    };
    uploadFiles([createMockFile('x.pdf'), createMockFile('y.pdf'), createMockFile('z.pdf')]);
    fireEvent.change(screen.getByPlaceholderText(/Paste API key here/i), { target: { value: 'key' } });
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));
    await waitFor(() => screen.getByText(/TieCo/i));
    // Focus fallback text
    expect(screen.getByText(/profitability focus/i)).toBeInTheDocument();
    // Exec summary grid not rendered
    expect(screen.queryByText(/Key Strengths/i)).not.toBeInTheDocument();
  });

  test('12 - Sorting tie preserves order and search zero results', async () => {
    renderApp();
    const mockData = {
      success: true,
      trends: { financial_trends: [
        { metric: 'AlphaTie', trend_direction: 'stable', growth_rate: 7, importance_score: 1, data_quality: 'excellent', yearly_values: { 2023: 100 }, interpretation: 'A', indication: 'Hold' },
        { metric: 'BetaTie', trend_direction: 'stable', growth_rate: 7, importance_score: 2, data_quality: 'fair', yearly_values: { 2023: 100 }, interpretation: 'B', indication: 'Hold' }
      ] },
      summary: { overall_assessment: 'Ties', files_processed: 1, total_metrics_found: 2, critical_metrics_analyzed: 2 },
      metadata: { company_name: 'TieSortCo' }
    };
    uploadFiles([createMockFile('a.pdf'), createMockFile('b.pdf'), createMockFile('c.pdf')]);
    fireEvent.change(screen.getByPlaceholderText(/Paste API key here/i), { target: { value: 'key' } });
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));
    await waitFor(() => screen.getByText(/TieSortCo/i));
    const growthHeader = screen.getAllByText(/Growth Rate/).find(el => el.tagName === 'TH');
    fireEvent.click(growthHeader); // set sortBy growth_rate (desc)
    fireEvent.click(growthHeader); // toggle to asc (still tie)
    // Order should remain AlphaTie then BetaTie (tie comparator return 0 path)
    const rows = screen.getAllByRole('row').slice(1); // skip header
    expect(rows[0].textContent).toMatch(/AlphaTie/);
    expect(rows[1].textContent).toMatch(/BetaTie/);
    // Search with no results
    const searchInput = screen.getByPlaceholderText(/Search metrics/i);
    fireEvent.change(searchInput, { target: { value: 'ZZZ' } });
    // Header count shows 0 of 2
    await waitFor(() => expect(screen.getByText(/Financial Trend Metrics \(0 of 2\)/)).toBeInTheDocument());
  });

  test('13 - Recommendations list renders and chart placeholder', async () => {
    renderApp();
    const mockData = {
      success: true,
      trends: { financial_trends: [
        { metric: 'RecMetric', trend_direction: 'increasing', growth_rate: 12, importance_score: 3, data_quality: 'excellent', yearly_values: { 2022: 50, 2023: 60 }, interpretation: 'Up', indication: 'Positive' }
      ] },
      summary: {
        overall_assessment: 'Solid performance with room to optimize.',
        focus: 'liquidity_management',
        files_processed: 2,
        total_metrics_found: 1,
        critical_metrics_analyzed: 1,
        executive_summary: {
          key_strengths: ['Strong cash reserves'],
          major_concerns: ['Rising operating costs'],
          strategic_recommendations: ['Improve margins', 'Reduce discretionary spend']
        }
      },
      metadata: { company_name: 'RecCo' }
    };
    uploadFiles([createMockFile('r1.pdf'), createMockFile('r2.pdf'), createMockFile('r3.pdf')]);
    fireEvent.change(screen.getByPlaceholderText(/Paste API key here/i), { target: { value: 'api-123' } });
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));
    await waitFor(() => screen.getByText(/RecCo/));
    // Recommendations rendered
    expect(screen.getByText(/Improve margins/i)).toBeInTheDocument();
    expect(screen.getByText(/Reduce discretionary spend/i)).toBeInTheDocument();
  });

  test('14 - Drag events and metric deselect placeholder', async () => {
    renderApp();
    const dropZoneText = screen.getByText(/Drag & drop your files here/i);
    const dropZone = dropZoneText.parentElement;
    fireEvent.dragOver(dropZone);
    expect(dropZone).toHaveStyle('background-color: rgba(255, 255, 255, 0.1)');
    fireEvent.dragLeave(dropZone);
    expect(dropZone).not.toHaveStyle('background-color: rgba(255, 255, 255, 0.1)');
    // Proceed to analysis
    const mockData = {
      success: true,
      trends: { financial_trends: [
        { metric: 'DeselectMetric', trend_direction: 'stable', growth_rate: 0, importance_score: 1, data_quality: 'fair', yearly_values: { 2023: 10 }, interpretation: 'Flat', indication: 'Neutral' }
      ] },
      summary: { overall_assessment: 'Neutral outlook', files_processed: 1, total_metrics_found: 1, critical_metrics_analyzed: 1 },
      metadata: { company_name: 'DeselectCo' }
    };
    uploadFiles([createMockFile('d1.pdf'), createMockFile('d2.pdf'), createMockFile('d3.pdf')]);
    fireEvent.change(screen.getByPlaceholderText(/Paste API key here/i), { target: { value: 'api-key' } });
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));
    await waitFor(() => screen.getByText(/DeselectCo/));
    // Deselect metric triggers placeholder state
    const rowCell = screen.getByText('DeselectMetric');
    fireEvent.click(rowCell);
    expect(screen.getByText(/Select a metric from the table/i)).toBeInTheDocument();
  });


  test('15 - Hover transitions & zero growth data points', async () => {
    renderApp();
    // Prepare successful data to reach dashboard quickly
    const hoverData = {
      success: true,
      trends: {
        financial_trends: [
          { metric: 'HoverMetric', trend_direction: 'stable', growth_rate: 0, importance_score: 2, data_quality: 'poor', yearly_values: { 2021: 100, 2022: 100 }, interpretation: 'Flat', indication: 'Maintain' }
        ]
      },
      summary: { overall_assessment: 'Flat', files_processed: 2, total_metrics_found: 1, critical_metrics_analyzed: 1 },
      metadata: { company_name: 'HoverCo' }
    };
    // Upload valid 3 files
    uploadFiles([createMockFile('a.pdf'), createMockFile('b.pdf'), createMockFile('c.pdf')]);
    fireEvent.change(screen.getByPlaceholderText(/Paste API key here/i), { target: { value: 'hover-key' } });
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => hoverData });
    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));
    await waitFor(() => screen.getByText(/HoverCo/));
    // Chart data points text
    await waitFor(() => expect(screen.getByText(/data points from 2021 to 2022/i)).toBeInTheDocument());
    // Hover button transitions
    const backButton = screen.getByRole('button', { name: /Back to Upload/i });
    fireEvent.mouseEnter(backButton);
    expect(backButton.style.width).toBe('170px');
    fireEvent.mouseLeave(backButton);
    expect(backButton.style.width).toBe('40px');
  });
});

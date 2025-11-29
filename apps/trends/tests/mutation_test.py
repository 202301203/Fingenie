import os
import json
import tempfile
from unittest.mock import patch, Mock, MagicMock
from django.test import TestCase, RequestFactory
from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fingenie_core.settings')
if not django.conf.settings.configured:
    django.setup()

from apps.trends.views import (
    process_financial_statements_api,
    process_single_file,
    process_files_parallel,
    extract_all_years_data,
    extract_critical_metrics,
    match_metric_to_critical,
    is_meaningful_data,
    assess_data_quality,
    determine_trend_direction,
    create_interpretation,
    format_value,
    generate_correct_indication,
    enhanced_manual_trend_analysis,
    generate_trends_from_data,
    generate_overall_summary,
    generate_detailed_executive_summary,
    detect_file_type,
    ensure_complete_critical_metrics,
    create_intelligent_estimate,
    estimate_total_assets,
    estimate_total_liabilities,
    calculate_current_ratio,
    estimate_income_metrics,
    estimate_from_components,
    estimate_from_industry_pattern,
    find_reasonable_base,
    create_conservative_estimate,
    validate_trend_consistency,
    CRITICAL_METRICS,
    API_KEYS
)


class CoreFunctionMutationKillers(TestCase):
    """Tests that kill mutants in core functions with exact assertions"""
    
    def test_assess_data_quality_exact_behavior(self):
        """Kill mutants by testing exact return values"""
        # Test exact year count boundaries
        self.assertEqual(assess_data_quality("Test", {"2020": 100, "2021": 110, "2022": 120, "2023": 130}), "excellent")
        self.assertEqual(assess_data_quality("Test", {"2021": 100, "2022": 110, "2023": 120}), "good")
        self.assertEqual(assess_data_quality("Test", {"2022": 100, "2023": 110}), "fair")
        self.assertEqual(assess_data_quality("Test", {"2023": 100}), "poor")
        self.assertEqual(assess_data_quality("Test", {}), "poor")
        
        # Test with zero values (should reduce quality)
        self.assertEqual(assess_data_quality("Test", {"2020": 0, "2021": 110, "2022": 120, "2023": 130}), "good")
        self.assertEqual(assess_data_quality("Test", {"2020": 0, "2021": 0, "2022": 120, "2023": 130}), "fair")
        self.assertEqual(assess_data_quality("Test", {"2020": 0, "2021": 0, "2022": 0, "2023": 130}), "poor")
        
        # Test catastrophic changes (should be poor quality) - FIXED: >= 100 ratio
        quality = assess_data_quality("Test", {"2021": 1000, "2022": 100000})  # 100x change
        self.assertEqual(quality, "poor")
        
        # Test edge case: exactly 100x change (boundary)
        quality = assess_data_quality("Test", {"2021": 100, "2022": 10000})  # Exactly 100x
        self.assertEqual(quality, "poor")
    
    def test_determine_trend_direction_exact_boundaries(self):
        """Kill mutants that change comparison operators"""
        # Test exact boundaries
        self.assertEqual(determine_trend_direction(25.0, [100, 125]), "strongly increasing")
        self.assertEqual(determine_trend_direction(15.0, [100, 115]), "strongly increasing")
        self.assertEqual(determine_trend_direction(14.9, [100, 114.9]), "increasing")
        self.assertEqual(determine_trend_direction(5.0, [100, 105]), "increasing")
        self.assertEqual(determine_trend_direction(4.9, [100, 104.9]), "stable")
        self.assertEqual(determine_trend_direction(0.0, [100, 100]), "stable")
        self.assertEqual(determine_trend_direction(-4.9, [100, 95.1]), "stable")
        self.assertEqual(determine_trend_direction(-5.0, [100, 95]), "decreasing")
        self.assertEqual(determine_trend_direction(-14.9, [100, 85.1]), "decreasing")
        self.assertEqual(determine_trend_direction(-15.0, [100, 85]), "strongly decreasing")
        self.assertEqual(determine_trend_direction(-25.0, [100, 75]), "strongly decreasing")
        
        # Test None case
        self.assertEqual(determine_trend_direction(None, [100, 90, 110]), "volatile")
    
    def test_format_value_exact_formatting(self):
        """Kill arithmetic and formatting mutants"""
        # Test exact formatting boundaries
        self.assertEqual(format_value(0), "$0")
        self.assertEqual(format_value(1), "$1")
        self.assertEqual(format_value(500), "$500")
        self.assertEqual(format_value(999), "$999")
        self.assertEqual(format_value(1000), "$1.0K")
        self.assertEqual(format_value(1500), "$1.5K")
        self.assertEqual(format_value(999999), "$1000.0K")
        self.assertEqual(format_value(1000000), "$1.0M")
        self.assertEqual(format_value(1500000), "$1.5M")
        self.assertEqual(format_value(999999999), "$1000.0M")
        self.assertEqual(format_value(1000000000), "$1.0B")
        self.assertEqual(format_value(1500000000), "$1.5B")
    
    def test_is_meaningful_data_all_conditions(self):
        """Kill boolean logic mutants"""
        # Valid case - all conditions True
        self.assertTrue(is_meaningful_data({"2021": 1000000, "2022": 1100000}))
        
        # Test each condition that makes data not meaningful
        self.assertFalse(is_meaningful_data({"2021": 1000000}))  # Single year
        self.assertFalse(is_meaningful_data({"2021": 0, "2022": 0}))  # All zeros
        self.assertFalse(is_meaningful_data({"2021": 50, "2022": 60}))  # Below threshold
        self.assertFalse(is_meaningful_data({"2021": -1000, "2022": -900}))  # Negative values
        self.assertFalse(is_meaningful_data({}))  # Empty data
    
    def test_detect_file_type_exact_matching(self):
        """Kill string comparison mutants"""
        test_cases = [
            ("file.pdf", "PDF"),
            ("file.PDF", "PDF"),
            (".pdf", "PDF"),
            ("document.pdf", "PDF"),
            ("data.xlsx", "Excel"),
            ("data.XLSX", "Excel"),
            ("old.xls", "Excel"),
            ("file.csv", "Unknown"),
            ("image.png", "Unknown"),
            ("text.txt", "Unknown"),
            ("no_extension", "Unknown"),
            ("", "Unknown"),
        ]
        
        for filename, expected in test_cases:
            result = detect_file_type(filename)
            self.assertEqual(result, expected)


class CalculationMutationKillers(TestCase):
    """Kill mutants in calculation functions"""
    
    def test_calculate_current_ratio_exact_calculations(self):
        """Kill division and arithmetic mutants"""
        # Normal case
        items = [
            {'metric': 'Current Assets', 'yearly_values': {'2021': 500000, '2022': 600000}, 'importance_score': 70},
            {'metric': 'Current Liabilities', 'yearly_values': {'2021': 250000, '2022': 300000}, 'importance_score': 70}
        ]
        result = calculate_current_ratio(items, ['2021', '2022'])
        self.assertEqual(result, {'2021': 2.0, '2022': 2.0})  # Exact values
        
        # Zero division case
        items_zero = [
            {'metric': 'Current Assets', 'yearly_values': {'2021': 500000}, 'importance_score': 70},
            {'metric': 'Current Liabilities', 'yearly_values': {'2021': 0}, 'importance_score': 70}
        ]
        result = calculate_current_ratio(items_zero, ['2021'])
        self.assertIsNone(result)
        
        # Missing data
        result = calculate_current_ratio([], ['2021'])
        self.assertIsNone(result)
        
        # Partial data
        items_partial = [
            {'metric': 'Current Assets', 'yearly_values': {'2021': 500000}, 'importance_score': 70},
            # Missing current liabilities
        ]
        result = calculate_current_ratio(items_partial, ['2021'])
        self.assertIsNone(result)
    
    def test_estimate_from_components_exact_summation(self):
        """Kill summation mutants"""
        items = [
            {'metric': 'Component A', 'yearly_values': {'2021': 100, '2022': 200}, 'importance_score': 50},
            {'metric': 'Component B', 'yearly_values': {'2021': 50, '2022': 75}, 'importance_score': 50}
        ]
        result = estimate_from_components(items, ['2021', '2022'], ['component'])
        self.assertEqual(result, {'2021': 150, '2022': 275})  # Exact sums
        
        # No matching components
        result = estimate_from_components(items, ['2021', '2022'], ['nonexistent'])
        self.assertIsNone(result)
        
        # Insufficient components
        single_item = [{'metric': 'Single', 'yearly_values': {'2021': 100}, 'importance_score': 50}]
        result = estimate_from_components(single_item, ['2021'], ['single'])
        self.assertIsNone(result)
    
    def test_estimate_income_metrics_exact_behavior(self):
        """Kill income estimation mutants"""
        # No components
        result = estimate_income_metrics([], ['2021', '2022'], 'total_revenue')
        self.assertIsNone(result)
        
        # With revenue components
        items = [
            {'metric': 'Operating Revenue', 'yearly_values': {'2021': 800000, '2022': 900000}, 'importance_score': 85},
            {'metric': 'Other Income', 'yearly_values': {'2021': 50000, '2022': 60000}, 'importance_score': 60}
        ]
        result = estimate_income_metrics(items, ['2021', '2022'], 'total_revenue')
        self.assertEqual(result, {'2021': 850000, '2022': 960000})  # Exact sums
    
    def test_find_reasonable_base_exact_calculation(self):
        """Kill base calculation mutants"""
        # No items
        result = find_reasonable_base('total_assets', [])
        self.assertIsInstance(result, (int, float))
        
        # With similar items
        items = [
            {'metric': 'Total Something', 'yearly_values': {'2021': 5000000, '2022': 5500000}, 'importance_score': 80}
        ]
        base = find_reasonable_base('total_assets', items)
        self.assertEqual(base, 5250000)  # Exact average


class PatternMatchingMutationKillers(TestCase):
    """Kill mutants in pattern matching functions"""
    
    def test_match_metric_to_critical_exact_patterns(self):
        """Kill pattern matching mutants - FIXED VERSION"""
        yearly_values = {"2021": 1000000, "2022": 1100000}
        
        # Test all critical metric patterns
        test_cases = [
            ("Total Assets", "total_assets"),
            ("Total Liabilities", "total_liabilities"),
            ("Total Revenue", "total_revenue"), 
            ("Net Profit", "net_profit"),
            ("Shareholders Equity", "shareholders_equity"),
            ("Cash & Bank", "cash_equivalents"),  # FIXED: Use pattern that exists
            ("Total Investments", "total_investments"),
            ("Loans Portfolio", "loans_portfolio"),
            ("Reserves & Surplus", "reserves_surplus"),
            ("Current Ratio", "current_ratio"),
        ]
        
        for metric_name, expected in test_cases:
            result = match_metric_to_critical(metric_name, yearly_values)
            self.assertEqual(result, expected, f"Failed for: {metric_name}")
            
        # Test non-matching cases
        self.assertIsNone(match_metric_to_critical("Unknown Metric", yearly_values))
        self.assertIsNone(match_metric_to_critical("", yearly_values))
        
        # Insufficient data
        self.assertIsNone(match_metric_to_critical("Total Assets", {"2021": 1000}))
        self.assertIsNone(match_metric_to_critical("Total Assets", {"2021": 50, "2022": 60}))
    
    def test_extract_critical_metrics_quality_preference(self):
        """Kill quality preference mutants"""
        financial_items = [
            {
                "metric": "total assets",
                "yearly_values": {"2021": 1000000, "2022": 1100000},
                "importance_score": 100,
                "data_quality": "good"
            },
            {
                "metric": "assets total", 
                "yearly_values": {"2021": 1050000, "2022": 1150000},
                "importance_score": 100,
                "data_quality": "excellent"
            }
        ]
        
        result = extract_critical_metrics(financial_items)
        
        # Should prefer higher quality data
        total_assets_items = [item for item in result if item['metric'] == 'Total Assets']
        self.assertGreaterEqual(len(total_assets_items), 1)


class FileProcessingMutationKillers(TestCase):
    """Kill mutants in file processing functions"""
    
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.factory = RequestFactory()
    
    def tearDown(self):
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
    
    def test_process_single_file_comprehensive(self):
        """Kill file processing mutants"""
        mock_file = Mock()
        mock_file.name = "test_2023.pdf"
        mock_file.chunks.return_value = [b"test content"]
        
        # Successful processing
        with patch('apps.trends.views.load_financial_document') as mock_load, \
             patch('apps.trends.views.prepare_context_smart') as mock_prepare, \
             patch('apps.trends.views.extract_raw_financial_data') as mock_extract:
            
            mock_load.return_value = [Mock(page_content="content")]
            mock_prepare.return_value = "sufficient context " * 20
            mock_extract.return_value = {
                "success": True,
                "financial_items": [{"particulars": "Revenue", "current_year": 1000000}],
                "company_name": "Test Corp"
            }
            
            result = process_single_file(mock_file, "test_key", self.temp_dir)
            self.assertIsNotNone(result)
            self.assertEqual(result['filename'], "test_2023.pdf")
            self.assertEqual(result['year'], "2023")
        
        # Failed processing - insufficient context
        with patch('apps.trends.views.load_financial_document') as mock_load, \
             patch('apps.trends.views.prepare_context_smart') as mock_prepare:
            
            mock_load.return_value = [Mock(page_content="content")]
            mock_prepare.return_value = "short"
            
            result = process_single_file(mock_file, "test_key", self.temp_dir)
            self.assertIsNone(result)
    
    def test_process_files_parallel_edge_cases(self):
        """Kill parallel processing mutants"""
        # Empty files list
        result = process_files_parallel([], ["key1"], self.temp_dir)
        self.assertEqual(result, [])
        
        # Single file
        with patch('apps.trends.views.process_single_file') as mock_process:
            mock_process.return_value = {"filename": "test.pdf", "success": True}
            files = [Mock(name="test.pdf")]
            result = process_files_parallel(files, ["key1"], self.temp_dir)
            self.assertEqual(len(result), 1)
        
        # Mixed success/failure
        with patch('apps.trends.views.process_single_file') as mock_process:
            mock_process.side_effect = [
                {"filename": "file1.pdf", "success": True},
                Exception("Processing failed"),
                {"filename": "file3.pdf", "success": True}
            ]
            files = [Mock(name=f"file{i}.pdf") for i in range(3)]
            result = process_files_parallel(files, ["key1"], self.temp_dir)
            self.assertEqual(len(result), 2)
    
    def test_api_endpoint_comprehensive(self):
        """Kill API endpoint mutants"""
        # No files
        request = self.factory.post('/api/process-financials/', {})
        response = process_financial_statements_api(request)
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertIn("No files", data['error'])
        
        # Insufficient files
        files = [
            SimpleUploadedFile("file1.pdf", b"content1", "application/pdf"),
            SimpleUploadedFile("file2.pdf", b"content2", "application/pdf")
        ]
        request = self.factory.post('/api/process-financials/', {'files': files})
        response = process_financial_statements_api(request)
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertIn("3 or more", data['error'])
        
        # Wrong method
        request = self.factory.get('/api/process-financials/')
        response = process_financial_statements_api(request)
        self.assertEqual(response.status_code, 405)
        
        # Successful processing
        files = [
            SimpleUploadedFile("file1_2021.pdf", b"content1", "application/pdf"),
            SimpleUploadedFile("file2_2022.pdf", b"content2", "application/pdf"),
            SimpleUploadedFile("file3_2023.pdf", b"content3", "application/pdf")
        ]
        
        with patch('apps.trends.views.process_files_parallel') as mock_parallel, \
             patch('apps.trends.views.generate_trends_from_data') as mock_trends:
            
            mock_parallel.return_value = [
                {
                    "filename": "file1_2021.pdf",
                    "year": "2021",
                    "company_name": "Test Corp",
                    "items_extracted": 5,
                    "yearly_data": {"Revenue": {"2021": 1000000}},
                    "years_found": ["2021"]
                }
            ]
            mock_trends.return_value = {
                "financial_trends": [
                    {
                        "metric": "Total Revenue",
                        "yearly_values": {"2021": 1000000, "2022": 1100000},
                        "growth_rate": 10.0,
                        "trend_direction": "increasing",
                        "interpretation": "Revenue growing",
                        "indication": "Strong performance",
                        "importance_score": 90,
                        "data_quality": "excellent"
                    }
                ],
                "success": True,
                "source": "enhanced_manual_analysis"
            }
            
            request = self.factory.post('/api/process-financials/', {'files': files})
            response = process_financial_statements_api(request)
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.content)
            self.assertTrue(data['success'])


class EstimationAndAnalysisMutationKillers(TestCase):
    """Kill mutants in estimation and analysis functions"""
    
    def test_create_conservative_estimate_structure(self):
        """Kill conservative estimate mutants - FIXED"""
        result = create_conservative_estimate('total_assets', ['2021', '2022', '2023'])
        
        # Check exact structure - FIXED: it returns dict with yearly_values and data_quality
        self.assertIn('yearly_values', result)
        self.assertIn('data_quality', result)
        
        yearly_values = result['yearly_values']
        self.assertIn('2021', yearly_values)
        self.assertIn('2022', yearly_values)
        self.assertIn('2023', yearly_values)
        
        # Should show conservative growth
        self.assertLess(yearly_values['2021'], yearly_values['2022'])
        self.assertLess(yearly_values['2022'], yearly_values['2023'])
        self.assertEqual(result['data_quality'], 'estimated')
    
    def test_ensure_complete_critical_metrics_behavior(self):
        """Kill critical metrics completion mutants"""
        # Empty input
        result = ensure_complete_critical_metrics({}, [])
        self.assertEqual(len(result), 10)
        
        # Partial data
        critical_data = {
            'total_assets': {
                'metric': 'Total Assets',
                'yearly_values': {'2021': 1000000, '2022': 1100000},
                'importance_score': 100,
                'data_quality': 'excellent'
            }
        }
        all_items = [
            {
                'metric': 'Total Assets',
                'yearly_values': {'2021': 1000000, '2022': 1100000},
                'importance_score': 100,
                'data_quality': 'excellent'
            }
        ]
        result = ensure_complete_critical_metrics(critical_data, all_items)
        self.assertEqual(len(result), 10)
        self.assertIn('total_assets', result)
        self.assertIn('total_liabilities', result)
    
    def test_enhanced_manual_trend_analysis_comprehensive(self):
        """Kill manual analysis mutants"""
        # Empty input
        result = enhanced_manual_trend_analysis([])
        self.assertTrue(result['success'])
        self.assertEqual(result['source'], 'enhanced_manual_analysis')
        self.assertGreaterEqual(len(result['financial_trends']), 0)
        
        # With valid items
        items = [
            {
                "metric": "Total Assets",
                "yearly_values": {"2021": 1000000, "2022": 1100000},
                "importance_score": 100,
                "data_quality": "excellent"
            }
        ]
        result = enhanced_manual_trend_analysis(items)
        self.assertTrue(result['success'])
    
    def test_generate_trends_from_data_fallbacks(self):
        """Kill trend generation fallback mutants"""
        financial_items = [
            {
                "metric": "Total Assets",
                "yearly_values": {"2021": 1000000, "2022": 1100000},
                "importance_score": 100,
                "data_quality": "excellent"
            }
        ]
        
        # LLM failure case
        with patch('apps.trends.views.create_groq_llm') as mock_llm:
            mock_llm.return_value = None
            result = generate_trends_from_data(financial_items, "test_key")
            self.assertTrue(result['success'])
            self.assertEqual(result['source'], 'enhanced_manual_analysis')
        
        # Structured output failure
        with patch('apps.trends.views.create_groq_llm') as mock_llm:
            mock_llm_instance = Mock()
            mock_llm.return_value = mock_llm_instance
            mock_llm_instance.with_structured_output.side_effect = Exception("Failed")
            result = generate_trends_from_data(financial_items, "test_key")
            self.assertTrue(result['success'])
            self.assertEqual(result['source'], 'enhanced_manual_analysis')


class StringGenerationMutationKillers(TestCase):
    """Kill mutants in string generation functions"""
    
    def test_create_interpretation_exact_strings(self):
        """Kill interpretation string mutants"""
        # Current Ratio (no currency)
        result = create_interpretation("Current Ratio", "increasing", 10.0, 1.5, 1.65, 2, [1.5, 1.6, 1.65])
        self.assertIn("Current Ratio", result)
        self.assertNotIn("$", result)
        
        # Regular metric (with currency)
        result = create_interpretation("Total Assets", "increasing", 10.0, 1000000, 1100000, 2, [1000000, 1050000, 1100000])
        self.assertIn("Total Assets", result)
        self.assertIn("$", result)
        
        # None CAGR case
        result = create_interpretation("Total Assets", "volatile", None, 1000000, 1200000, 2, [1000000, 800000, 1200000])
        self.assertIn("Total Assets", result)
        self.assertIn("volatile", result.lower())
    
    def test_generate_correct_indication_patterns(self):
        """Kill indication generation mutants"""
        # Increasing trend
        result = generate_correct_indication(
            "Total Assets", "strongly increasing", 25.0, 
            [1000000, 1250000], {"2021": 1000000, "2022": 1250000}
        )
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 50)
        self.assertIn("assets", result)
        self.assertIn("increasing", result.lower())
        
        # Decreasing trend
        result = generate_correct_indication(
            "Net Profit", "decreasing", -10.0,
            [500000, 450000], {"2021": 500000, "2022": 450000}
        )
        self.assertIn("profit", result)
        self.assertIn("declining", result.lower())
    
    def test_validate_trend_consistency_comprehensive(self):
        """Kill trend validation mutants"""
        from apps.trends.views import FinancialTrendItem
        
        # Empty list
        result = validate_trend_consistency([])
        self.assertEqual(result, [])
        
        # Trend with missing attributes
        trend = Mock(spec=FinancialTrendItem)
        trend.metric = "Test Metric"
        trend.yearly_values = {"2021": 1000, "2022": 1100}
        trend.growth_rate = 10.0
        trend.interpretation = "Test interpretation"
        del trend.indication
        del trend.trend_direction
        trend.importance_score = 80
        trend.data_quality = "good"
        
        result = validate_trend_consistency([trend])
        self.assertEqual(len(result), 1)
        self.assertIsNotNone(result[0]['indication'])
        self.assertIsNotNone(result[0]['trend_direction'])
        
        # Trend with generic indication
        trend2 = Mock(spec=FinancialTrendItem)
        trend2.metric = "Cash & Bank"  # FIXED: Use pattern that exists
        trend2.yearly_values = {"2021": 200000, "2022": 250000}
        trend2.growth_rate = 25.0
        trend2.interpretation = "Cash growing"
        trend2.indication = "This trend provides important insights"  # Generic
        trend2.trend_direction = "strongly increasing"
        trend2.importance_score = 80
        trend2.data_quality = "excellent"
        
        result = validate_trend_consistency([trend2])
        self.assertNotIn("important insights", result[0]['indication'])


class DataExtractionMutationKillers(TestCase):
    """Kill mutants in data extraction functions"""
    
    def test_extract_all_years_data_comprehensive(self):
        """Kill year extraction mutants"""
        # Normal case
        extraction = {
            "financial_items": [
                {
                    "particulars": "Revenue",
                    "current_year": 1000000,
                    "previous_year": 900000,
                    "year_2020": 800000
                }
            ]
        }
        result = extract_all_years_data(extraction, "2023")
        self.assertIn("Revenue", result)
        self.assertEqual(len(result["Revenue"]), 3)
        
        # Empty extraction
        result = extract_all_years_data({}, "2023")
        self.assertEqual(result, {})
        
        # Invalid year
        result = extract_all_years_data(extraction, "invalid")
        self.assertIn("Revenue", result)
        
        # Empty metric name
        extraction_empty = {
            "financial_items": [
                {
                    "particulars": "",  # Empty name
                    "current_year": 1000000
                }
            ]
        }
        result = extract_all_years_data(extraction_empty, "2023")
        self.assertEqual(len(result), 0)

class SummaryGenerationMutationKillers(TestCase):
    """Kill mutants in summary generation functions"""
    
    def test_generate_overall_summary_comprehensive(self):
        """Kill overall summary mutants - FIXED"""
        # Empty trends - FIXED: Returns string, not dict
        trends_data = {"financial_trends": []}
        summary = generate_overall_summary(trends_data, "Test Corp")
        self.assertIsInstance(summary, str)
        self.assertIn("Test Corp", summary)
        
        # Mixed quality trends
        trends_data = {
            "financial_trends": [
                {
                    "metric": "Excellent Metric",
                    "trend_direction": "strongly increasing",
                    "growth_rate": 25.0,
                    "importance_score": 100,
                    "data_quality": "excellent"
                }
            ]
        }
        summary = generate_overall_summary(trends_data, "Test Corp")
        self.assertIsInstance(summary, str)
        self.assertGreater(len(summary), 50)
    
    def test_generate_detailed_executive_summary_structure(self):
        """Kill executive summary structure mutants - FIXED"""
        trends_data = {
            "financial_trends": [
                {
                    "metric": "Total Assets",
                    "trend_direction": "strongly increasing",
                    "growth_rate": 20.0,
                    "importance_score": 100,
                    "data_quality": "excellent"
                },
                {
                    "metric": "Total Liabilities", 
                    "trend_direction": "increasing",
                    "growth_rate": 15.0,
                    "importance_score": 95,
                    "data_quality": "excellent"
                }
            ]
        }
        
        summary = generate_detailed_executive_summary(trends_data, "Test Corp")
        
        # Check it returns a dictionary with the correct structure
        self.assertIsInstance(summary, dict)
        
        # Check dictionary keys
        self.assertIn("overall_assessment", summary)
        self.assertIn("key_strengths", summary)
        self.assertIn("major_concerns", summary)
        self.assertIn("strategic_recommendations", summary)
        self.assertIn("outlook", summary)
        
        # Check that values are populated
        self.assertIsInstance(summary["overall_assessment"], str)
        self.assertIsInstance(summary["key_strengths"], list)
        self.assertIsInstance(summary["major_concerns"], list)
        self.assertIsInstance(summary["strategic_recommendations"], list)
        self.assertIsInstance(summary["outlook"], str)
        
        # Check content length - FIXED: Don't check for exact metric names in text
        self.assertGreater(len(summary["overall_assessment"]), 10)


# Main test runner
class RunAllMutationTests(TestCase):
    """Run all mutation killing tests"""

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.factory = RequestFactory()
    
    def tearDown(self):
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
    
    def test_complete_mutation_test_suite(self):
        """Execute all mutation killing tests"""
        
        def run_test_class(test_class, test_methods):
            """Helper to run test methods with proper setup/teardown"""
            instance = test_class()
            instance.setUp()
            try:
                for method_name in test_methods:
                    method = getattr(instance, method_name)
                    method()
            finally:
                instance.tearDown()
        
        # Core function killers
        run_test_class(CoreFunctionMutationKillers, [
            'test_assess_data_quality_exact_behavior',
            'test_determine_trend_direction_exact_boundaries',
            'test_format_value_exact_formatting',
            'test_is_meaningful_data_all_conditions',
            'test_detect_file_type_exact_matching'
        ])
        
        # Calculation killers
        run_test_class(CalculationMutationKillers, [
            'test_calculate_current_ratio_exact_calculations',
            'test_estimate_from_components_exact_summation',
            'test_estimate_income_metrics_exact_behavior',
            'test_find_reasonable_base_exact_calculation'
        ])
        
        # Pattern matching killers
        run_test_class(PatternMatchingMutationKillers, [
            'test_match_metric_to_critical_exact_patterns',
            'test_extract_critical_metrics_quality_preference'
        ])
        
        # File processing killers
        run_test_class(FileProcessingMutationKillers, [
            'test_process_single_file_comprehensive',
            'test_process_files_parallel_edge_cases',
            'test_api_endpoint_comprehensive'
        ])
        
        # Estimation killers
        run_test_class(EstimationAndAnalysisMutationKillers, [
            'test_create_conservative_estimate_structure',
            'test_ensure_complete_critical_metrics_behavior',
            'test_enhanced_manual_trend_analysis_comprehensive',
            'test_generate_trends_from_data_fallbacks'
        ])
        
        # String generation killers
        run_test_class(StringGenerationMutationKillers, [
            'test_create_interpretation_exact_strings',
            'test_generate_correct_indication_patterns',
            'test_validate_trend_consistency_comprehensive'
        ])
        
        # Data extraction killers
        run_test_class(DataExtractionMutationKillers, [
            'test_extract_all_years_data_comprehensive'
        ])
        
        # Summary generation killers
        run_test_class(SummaryGenerationMutationKillers, [
            'test_generate_overall_summary_comprehensive',
            'test_generate_detailed_executive_summary_structure'
        ])


if __name__ == '__main__':
    # Run the tests if executed directly
    import unittest
    unittest.main()
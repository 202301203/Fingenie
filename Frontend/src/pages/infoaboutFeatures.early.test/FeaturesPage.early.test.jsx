
import React from "react";
import { useNavigate } from "react-router-dom";
import FeaturesPage from '../infoaboutFeatures';

// infoaboutFeatures.test.jsx
import { fireEvent, render, screen } from '@testing-library/react';
import "@testing-library/jest-dom";

// infoaboutFeatures.test.jsx
// Mocking the components and hooks
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

jest.mock("../../components/Footer", () => () => <div data-testid="footer">Footer</div>);

jest.mock("../../images/fglogo_Wbg.png", () => 'mocked-logo.png');

describe('FeaturesPage() FeaturesPage method', () => {
  let navigateMock;

  beforeEach(() => {
    navigateMock = useNavigate();
  });

  describe('Happy Paths', () => {
    test('should render the FeaturesPage with all features', () => {
      // Render the FeaturesPage component
      render(<FeaturesPage />);

      // Check if the header is rendered
      expect(screen.getByAltText('logo')).toBeInTheDocument();
      expect(screen.getByText('News')).toBeInTheDocument();
      expect(screen.getByText('About us')).toBeInTheDocument();
      expect(screen.getByText('Sign up')).toBeInTheDocument();

      // Check if the page title and subtitle are rendered
      expect(screen.getByText('Explore Our Tools')).toBeInTheDocument();
      expect(screen.getByText('Everything you need for financial analysis, powered by AI.')).toBeInTheDocument();

      // Check if all feature cards are rendered
      const featureTitles = [
        'AI Summary Generator',
        'Company Comparison',
        'Trends & KPIs',
        'Search Public Companies',
        'Blog Page',
        'Sector Overview',
      ];
      featureTitles.forEach((title) => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });

      // Check if the footer is rendered
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    test('should navigate to the correct page when a feature button is clicked', () => {
      // Render the FeaturesPage component
      render(<FeaturesPage />);

      // Simulate clicking the "Try it now" button for the first feature
      const tryItNowButtons = screen.getAllByText('Try it now');
      fireEvent.click(tryItNowButtons[0]);

      // Check if navigate was called with the correct path
      expect(navigateMock).toHaveBeenCalledWith('/AuthFlow');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty features array gracefully', () => {
      // Mock the features array to be empty
      jest.spyOn(React, 'useState').mockImplementation(() => [[], jest.fn()]);

      // Render the FeaturesPage component
      render(<FeaturesPage />);

      // Check if the page still renders without crashing
      expect(screen.getByText('Explore Our Tools')).toBeInTheDocument();
      expect(screen.getByText('Everything you need for financial analysis, powered by AI.')).toBeInTheDocument();
    });

    test('should handle navigation errors gracefully', () => {
      // Mock navigate to throw an error
      navigateMock.mockImplementation(() => {
        throw new Error('Navigation error');
      });

      // Render the FeaturesPage component
      render(<FeaturesPage />);

      // Simulate clicking the "Try it now" button for the first feature
      const tryItNowButtons = screen.getAllByText('Try it now');
      fireEvent.click(tryItNowButtons[0]);

      // Check if the page still renders without crashing
      expect(screen.getByText('Explore Our Tools')).toBeInTheDocument();
    });
  });
});
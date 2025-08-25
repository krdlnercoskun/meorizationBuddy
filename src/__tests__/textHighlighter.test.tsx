import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TextHighlighter } from '../components/TextHighlighter/TextHighlighter';
import { AlignedToken } from '../types';

const mockTokens: AlignedToken[] = [
  {
    reference: 'Hello',
    recognized: 'Hello',
    status: 'correct',
    confidence: 1.0,
    position: 0
  },
  {
    reference: 'world',
    recognized: 'word',
    status: 'near-miss',
    confidence: 0.8,
    position: 1
  },
  {
    reference: 'test',
    recognized: 'text',
    status: 'error',
    confidence: 0.3,
    position: 2
  },
  {
    reference: 'missing',
    recognized: '',
    status: 'missing',
    confidence: 0,
    position: 3
  }
];

describe('TextHighlighter', () => {
  test('renders all tokens correctly', () => {
    render(<TextHighlighter tokens={mockTokens} />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('world')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('missing')).toBeInTheDocument();
  });

  test('applies correct CSS classes based on token status', () => {
    render(<TextHighlighter tokens={mockTokens} />);
    
    const correctToken = screen.getByText('Hello');
    const nearMissToken = screen.getByText('world');
    const errorToken = screen.getByText('test');
    const missingToken = screen.getByText('missing');
    
    expect(correctToken).toHaveClass('bg-green-100');
    expect(nearMissToken).toHaveClass('bg-amber-100');
    expect(errorToken).toHaveClass('bg-red-100');
    expect(missingToken).toHaveClass('bg-gray-100');
  });

  test('shows recognized text when showReference is false', () => {
    const tokensWithRecognized = [
      {
        reference: 'hello',
        recognized: 'helo',
        status: 'error' as const,
        confidence: 0.5,
        position: 0
      }
    ];
    
    render(<TextHighlighter tokens={tokensWithRecognized} showReference={false} />);
    
    expect(screen.getByText('helo')).toBeInTheDocument();
    expect(screen.queryByText('hello')).not.toBeInTheDocument();
  });

  test('calls onTokenClick when token is clicked', () => {
    const mockOnClick = jest.fn();
    render(<TextHighlighter tokens={mockTokens} onTokenClick={mockOnClick} />);
    
    const firstToken = screen.getByText('Hello');
    fireEvent.click(firstToken);
    
    expect(mockOnClick).toHaveBeenCalledWith(mockTokens[0]);
  });

  test('handles keyboard interaction for accessibility', () => {
    const mockOnClick = jest.fn();
    render(<TextHighlighter tokens={mockTokens} onTokenClick={mockOnClick} />);
    
    const firstToken = screen.getByText('Hello');
    fireEvent.keyPress(firstToken, { key: 'Enter' });
    
    expect(mockOnClick).toHaveBeenCalledWith(mockTokens[0]);
  });

  test('displays color legend', () => {
    render(<TextHighlighter tokens={mockTokens} />);
    
    expect(screen.getByText('Color Legend:')).toBeInTheDocument();
    expect(screen.getByText('Correct')).toBeInTheDocument();
    expect(screen.getByText('Near Miss')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Missing')).toBeInTheDocument();
    expect(screen.getByText('Extra')).toBeInTheDocument();
  });

  test('provides appropriate tooltips', () => {
    render(<TextHighlighter tokens={mockTokens} />);
    
    const correctToken = screen.getByText('Hello');
    const nearMissToken = screen.getByText('world');
    
    expect(correctToken).toHaveAttribute('title', 'Correct: "Hello"');
    expect(nearMissToken).toHaveAttribute('title', 'Close match (80%): "world" ≈ "word"');
  });

  test('handles empty tokens array', () => {
    render(<TextHighlighter tokens={[]} />);
    
    // Should still render the legend
    expect(screen.getByText('Color Legend:')).toBeInTheDocument();
  });

  test('handles tokens with empty strings', () => {
    const tokensWithEmpty = [
      {
        reference: '',
        recognized: 'extra',
        status: 'extra' as const,
        confidence: 0,
        position: -1
      }
    ];
    
    render(<TextHighlighter tokens={tokensWithEmpty} />);
    
    expect(screen.getByText('extra')).toBeInTheDocument();
  });
});
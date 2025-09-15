import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Delta app', () => {
  render(<App />);
  const deltaElement = screen.getByText(/DELTA/i);
  expect(deltaElement).toBeInTheDocument();
});

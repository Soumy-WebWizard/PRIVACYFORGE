import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App.jsx';

describe('PrivacyForge Dashboard UI', () => {
  it('renders branding, tagline, and local-processing indicator', () => {
    render(<App />);
    expect(screen.getAllByText(/Your data\. Your browser\. Zero exposure\./i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Local Browser Processing/i)).toBeInTheDocument();
  });

  it('updates live statistics and side-by-side output across all three redaction modes', () => {
    render(<App />);

    const editor = screen.getByLabelText(/Raw Text \/ CSV Content/i);
    fireEvent.change(editor, {
      target: { value: 'Email: john@example.com | Repeat: john@example.com | IP: 192.168.1.10' },
    });

    expect(screen.getByTestId('stat-total-detections')).toHaveTextContent('3');
    expect(screen.getByTestId('stat-unique-categories')).toHaveTextContent('2 / 6');
    expect(screen.getByTestId('stat-remaining')).toHaveTextContent('0');

    // Default mode is Consistent Pseudonymization
    expect(screen.getByTestId('sanitized-preview')).toHaveTextContent('USER_01');
    expect(screen.getByTestId('sanitized-preview')).toHaveTextContent('IP_01');

    // Switch to Full Mask
    fireEvent.click(screen.getByRole('button', { name: /Full Mask/i }));
    expect(screen.getByTestId('sanitized-preview')).toHaveTextContent('[REDACTED]');

    // Switch to Partial Mask
    fireEvent.click(screen.getByRole('button', { name: /Partial Mask/i }));
    expect(screen.getByTestId('sanitized-preview')).toHaveTextContent('j***@example.com');
    expect(screen.getByTestId('sanitized-preview')).toHaveTextContent('192.168.1.xxx');
  });

  it('safely renders HTML/script-like user text without XSS injection', () => {
    render(<App />);
    const editor = screen.getByLabelText(/Raw Text \/ CSV Content/i);
    const xssPayload = '<img src=x onerror="window.__xss=1"><script>alert(1)</script> john@example.com';

    fireEvent.change(editor, { target: { value: xssPayload } });

    const preview = screen.getByTestId('original-preview');
    expect(preview.querySelector('script')).toBeNull();
    expect(preview.querySelector('img')).toBeNull();
    expect(preview).toHaveTextContent('<script>alert(1)</script>');
    expect(window.__xss).toBeUndefined();
  });
});

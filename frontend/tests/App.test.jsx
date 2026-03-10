/**
 * App.test.jsx — Tests for the main App component and its navigation flow.
 *
 * Runs with Vitest + @testing-library/react.
 * The API module is mocked so no real HTTP calls are made.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock the API module before importing App
vi.mock('../src/api', () => ({
  processImage: vi.fn(),
}));

import App from '../src/App';
import { LanguageProvider } from '../src/i18n';
import { processImage } from '../src/api';

const MOCK_RESULT = {
  mode: 'raw',
  ocr_text: 'Invoice #42\nTotal: $100',
  retrieved: null,
  llm_output: 'This is an invoice for $100.',
  provenance: { mode: 'raw', ocr_model: 'zai-org/GLM-OCR' },
};

/** Render App wrapped in LanguageProvider */
function renderApp() {
  return render(
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}

// Helper: navigate from landing → through tutorial → demo view
function navigateToDemoView() {
  // Click "Try Demo" on the landing page
  fireEvent.click(screen.getByRole('button', { name: /try demo/i }));
  // Skip the tutorial to go straight to demo
  fireEvent.click(screen.getByRole('button', { name: /skip tutorial/i }));
}

describe('App — Landing page', () => {
  it('renders the landing page heading by default', () => {
    renderApp();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/FraudGuard/i);
  });

  it('renders the Try Demo button on the landing page', () => {
    renderApp();
    expect(screen.getByRole('button', { name: /try demo/i })).toBeInTheDocument();
  });

  it('shows available analysis mode hints on the landing page', () => {
    renderApp();
    expect(screen.getByText(/LLM — Fast direct analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/LLM \+ RAG — Context-aware analysis/i)).toBeInTheDocument();
  });

  it('renders language toggle on the landing page', () => {
    renderApp();
    expect(screen.getByRole('radiogroup', { name: /language selector/i })).toBeInTheDocument();
  });
});

describe('App — Onboarding tutorial', () => {
  it('shows the tutorial dialog when Try Demo is clicked', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /try demo/i }));
    expect(screen.getByRole('dialog', { name: /onboarding tutorial/i })).toBeInTheDocument();
  });

  it('displays the first tutorial step title', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /try demo/i }));
    expect(screen.getByText(/Welcome to HK FraudGuard/i)).toBeInTheDocument();
  });

  it('advances to the next step on "Next" click', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /try demo/i }));
    fireEvent.click(screen.getByRole('button', { name: /go to next step/i }));
    expect(screen.getByText(/Step 1 — Take a Photo/i)).toBeInTheDocument();
  });

  it('can navigate back to a previous step', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /try demo/i }));
    fireEvent.click(screen.getByRole('button', { name: /go to next step/i }));
    fireEvent.click(screen.getByRole('button', { name: /go to previous step/i }));
    expect(screen.getByText(/Welcome to HK FraudGuard/i)).toBeInTheDocument();
  });

  it('hides the tutorial and shows demo when Skip Tutorial is clicked', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /try demo/i }));
    fireEvent.click(screen.getByRole('button', { name: /skip tutorial/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/HK FraudGuard Demo/i);
  });

  it('closes the tutorial and shows demo after reaching the last step', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /try demo/i }));

    // Advance through all 6 steps
    const totalSteps = 6;
    for (let i = 1; i < totalSteps; i++) {
      fireEvent.click(screen.getByRole('button', { name: /go to next step/i }));
    }
    // Last step shows "Start Demo"
    fireEvent.click(screen.getByRole('button', { name: /start the demo/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/HK FraudGuard Demo/i);
  });

  it('shows page counter in the tutorial', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /try demo/i }));
    // The tutorial has 6 steps (matches STEPS array length in OnboardingTutorial.jsx)
    const TOTAL_STEPS = 6;
    expect(screen.getByText(`1 / ${TOTAL_STEPS}`)).toBeInTheDocument();
  });
});

describe('App — Demo view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the demo heading in demo view', () => {
    renderApp();
    navigateToDemoView();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/HK FraudGuard Demo/i);
  });

  it('renders mode toggle with Raw LLM selected by default', () => {
    renderApp();
    navigateToDemoView();
    const rawRadio = screen.getByLabelText('Raw LLM');
    expect(rawRadio).toBeChecked();
  });

  it('allows switching to LLM + RAG mode', () => {
    renderApp();
    navigateToDemoView();
    const ragRadio = screen.getByLabelText('LLM + RAG');
    fireEvent.click(ragRadio);
    expect(ragRadio).toBeChecked();
  });

  it('renders file input and submit button', () => {
    renderApp();
    navigateToDemoView();
    expect(screen.getByLabelText(/image file/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /process/i })).toBeInTheDocument();
  });

  it('submit button is disabled when no file is selected', () => {
    renderApp();
    navigateToDemoView();
    expect(screen.getByRole('button', { name: /process/i })).toBeDisabled();
  });

  it('displays OCR text and LLM output after successful submission', async () => {
    processImage.mockResolvedValueOnce(MOCK_RESULT);

    renderApp();
    navigateToDemoView();

    const fileInput = screen.getByLabelText(/image file/i);
    const file = new File(['fake image'], 'test.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /process/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invoice #42/i)).toBeInTheDocument();
      expect(screen.getByText(/This is an invoice/i)).toBeInTheDocument();
    });
  });

  it('displays error message when API call fails', async () => {
    processImage.mockRejectedValueOnce(new Error('Network error'));

    renderApp();
    navigateToDemoView();

    const fileInput = screen.getByLabelText(/image file/i);
    const file = new File(['fake image'], 'test.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /process/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    });
  });

  it('shows retrieved passages section in RAG mode results', async () => {
    const ragResult = {
      ...MOCK_RESULT,
      mode: 'rag',
      retrieved: ['Passage one about invoices.', 'Passage two about payments.'],
    };
    processImage.mockResolvedValueOnce(ragResult);

    renderApp();
    navigateToDemoView();

    fireEvent.click(screen.getByLabelText('LLM + RAG'));

    const fileInput = screen.getByLabelText(/image file/i);
    const file = new File(['fake image'], 'test.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /process/i }));

    await waitFor(() => {
      expect(screen.getByText(/Passage one about invoices/i)).toBeInTheDocument();
      expect(screen.getByText(/Passage two about payments/i)).toBeInTheDocument();
    });
  });

  it('sends the correct mode to the API', async () => {
    processImage.mockResolvedValueOnce({ ...MOCK_RESULT, mode: 'rag' });

    renderApp();
    navigateToDemoView();
    fireEvent.click(screen.getByLabelText('LLM + RAG'));

    const file = new File(['img'], 'scan.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/image file/i), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /process/i }));

    await waitFor(() => {
      expect(processImage).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'rag' })
      );
    });
  });

  it('returns to landing page when Back to Home is clicked', () => {
    renderApp();
    navigateToDemoView();
    fireEvent.click(screen.getByRole('button', { name: /back to home/i }));
    expect(screen.getByRole('button', { name: /try demo/i })).toBeInTheDocument();
  });
});

describe('App — Language switching', () => {
  it('switches to Traditional Chinese when 繁體 is clicked', () => {
    renderApp();
    fireEvent.click(screen.getByRole('radio', { name: '繁體' }));
    expect(screen.getByText(/立即試用/)).toBeInTheDocument();
  });

  it('switches to Simplified Chinese when 简体 is clicked', () => {
    renderApp();
    fireEvent.click(screen.getByRole('radio', { name: '简体' }));
    expect(screen.getByText(/立即试用/)).toBeInTheDocument();
  });

  it('switches back to English when EN is clicked', () => {
    renderApp();
    // Switch to Chinese first
    fireEvent.click(screen.getByRole('radio', { name: '繁體' }));
    expect(screen.getByText(/立即試用/)).toBeInTheDocument();
    // Switch back to English
    fireEvent.click(screen.getByRole('radio', { name: 'EN' }));
    expect(screen.getByRole('button', { name: /try demo/i })).toBeInTheDocument();
  });

  it('tutorial displays in Traditional Chinese when language is switched', () => {
    renderApp();
    fireEvent.click(screen.getByRole('radio', { name: '繁體' }));
    fireEvent.click(screen.getByRole('button', { name: /立即試用/ }));
    expect(screen.getByText(/歡迎使用 HK FraudGuard/)).toBeInTheDocument();
  });

  it('tutorial displays in Simplified Chinese when language is switched', () => {
    renderApp();
    fireEvent.click(screen.getByRole('radio', { name: '简体' }));
    fireEvent.click(screen.getByRole('button', { name: /立即试用/ }));
    expect(screen.getByText(/欢迎使用 HK FraudGuard/)).toBeInTheDocument();
  });
});

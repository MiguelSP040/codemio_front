import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalysisStatusCard, { statusConfig } from './AnalysisStatusCard';

describe('AnalysisStatusCard', () => {
  it('falls back to idle status when an unknown status is given', () => {
    render(<AnalysisStatusCard analysisStatus="gibberish" />);
    expect(screen.getByText(statusConfig.idle.label)).toBeInTheDocument();
  });

  it('renders the processing status with a progress bar', () => {
    render(<AnalysisStatusCard analysisStatus="processing" lastUpdated="hace 1m" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Última actualización: hace 1m')).toBeInTheDocument();
  });

  it('renders the completed_with_warnings status', () => {
    render(<AnalysisStatusCard analysisStatus="completed_with_warnings" />);
    expect(
      screen.getByText(statusConfig.completed_with_warnings.label),
    ).toBeInTheDocument();
  });

  it('renders the error status with placeholder timestamp', () => {
    render(<AnalysisStatusCard analysisStatus="error" />);
    expect(screen.getByText('Última actualización: Sin registros aún')).toBeInTheDocument();
  });
});

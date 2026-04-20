import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CodeInput from './CodeInput';

describe('CodeInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the requested number of digit inputs', () => {
    render(<CodeInput onChange={vi.fn()} length={4} />);
    expect(screen.getAllByRole('textbox')).toHaveLength(4);
  });

  it('filters non-digit input', () => {
    const onChange = vi.fn();
    render(<CodeInput onChange={onChange} length={4} />);
    const [first] = screen.getAllByRole('textbox');

    fireEvent.change(first, { target: { value: 'a' } });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(first, { target: { value: '7' } });
    expect(onChange).toHaveBeenLastCalledWith('7');
  });

  it('fires onComplete when all digits are filled', () => {
    const onComplete = vi.fn();
    render(<CodeInput onChange={vi.fn()} onComplete={onComplete} length={3} />);
    const inputs = screen.getAllByRole('textbox');

    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });
    fireEvent.change(inputs[2], { target: { value: '3' } });

    expect(onComplete).toHaveBeenCalledWith('123');
  });

  it('handles backspace on empty box by moving focus backward', () => {
    render(<CodeInput onChange={vi.fn()} length={3} />);
    const inputs = screen.getAllByRole('textbox');

    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.keyDown(inputs[1], { key: 'Backspace' });

    expect(inputs[0]).toHaveFocus();
  });

  it('navigates with arrow keys', () => {
    render(<CodeInput onChange={vi.fn()} length={3} />);
    const inputs = screen.getAllByRole('textbox');

    inputs[1].focus();
    fireEvent.keyDown(inputs[1], { key: 'ArrowLeft' });
    expect(inputs[0]).toHaveFocus();

    fireEvent.keyDown(inputs[0], { key: 'ArrowRight' });
    expect(inputs[1]).toHaveFocus();
  });

  it('spreads pasted digits across boxes', () => {
    const onChange = vi.fn();
    render(<CodeInput onChange={onChange} length={4} />);
    const inputs = screen.getAllByRole('textbox');

    fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => '9876' },
    });

    expect(onChange).toHaveBeenLastCalledWith('9876');
  });

  it('syncs with external value prop', () => {
    const { rerender } = render(<CodeInput onChange={vi.fn()} value="12" length={4} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0].value).toBe('1');
    expect(inputs[1].value).toBe('2');

    rerender(<CodeInput onChange={vi.fn()} value="5678" length={4} />);
    expect(inputs[0].value).toBe('5');
    expect(inputs[3].value).toBe('8');
  });

  it('renders in error state', () => {
    const { container } = render(<CodeInput onChange={vi.fn()} error length={3} />);
    expect(container.querySelector('.code-input--error')).toBeInTheDocument();
  });
});

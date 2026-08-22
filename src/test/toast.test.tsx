import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from '@/components/common/Toast';

function TestChild() {
  const { toast } = useToast();
  return (
    <button onClick={() => toast('Hello toast', 'success')}>
      Show
    </button>
  );
}

describe('ToastProvider', () => {
  it('renders children', () => {
    render(
      <ToastProvider>
        <TestChild />
      </ToastProvider>
    );
    expect(screen.getByText('Show')).toBeInTheDocument();
  });

  it('throws when useToast used outside provider', () => {
    function Orphan() {
      useToast();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow('useToast must be used within ToastProvider');
  });
});

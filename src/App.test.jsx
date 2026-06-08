import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

vi.mock('./services/modelService', () => ({
  getModelInfo: vi.fn().mockRejectedValue(new Error('not needed in unit tests')),
}));

vi.mock('./hooks/useSearch', () => ({
  useSearch: vi.fn(() => ({
    input: '',
    setInput: vi.fn(),
    results: [],
    hasSearched: false,
    loading: false,
    error: null,
    handleSubmit: vi.fn((e) => e?.preventDefault?.()),
    handleNewSearch: vi.fn(),
  })),
}));

describe('App tabs and localization', () => {
  test('shows regulations, cases, and consult tabs, without generate tab', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: 'بحث الأنظمة' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'بحث السوابق' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'استشارة' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /generate/i })).not.toBeInTheDocument();
  });

  test('switches to English and shows consult label consistently', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(screen.getByRole('button', { name: 'Consult' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Chat' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /generate/i })).not.toBeInTheDocument();
  });
});

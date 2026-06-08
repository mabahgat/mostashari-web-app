import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ChatContent } from './ChatContent';
import translations from '../i18n';

vi.mock('../services/chatService', () => ({
  sendChatMessage: vi.fn(async () => ({
    response: 'Mock assistant response',
    sessionId: 'session-1',
    messageCount: 1,
    lastActivityAt: '2026-06-08T00:00:00Z',
  })),
  clearCurrentSession: vi.fn(),
}));

describe('ChatContent message rendering', () => {
  test('aligns message text left for English', async () => {
    render(<ChatContent t={translations.en} language="en" />);

    fireEvent.change(screen.getByPlaceholderText('Type your message...'), {
      target: { value: 'Hello from user' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByText('Mock assistant response')).toBeInTheDocument();
    });

    expect(screen.getByText('Hello from user')).toHaveStyle({ textAlign: 'left' });
    expect(screen.getByText('Mock assistant response')).toHaveStyle({ textAlign: 'left' });
  });

  test('aligns message text right for Arabic', async () => {
    render(<ChatContent t={translations.ar} language="ar" />);

    fireEvent.change(screen.getByPlaceholderText('اكتب رسالتك...'), {
      target: { value: 'مرحبا' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'إرسال' }));

    await waitFor(() => {
      expect(screen.getByText('Mock assistant response')).toBeInTheDocument();
    });

    expect(screen.getByText('مرحبا')).toHaveStyle({ textAlign: 'right' });
    expect(screen.getByText('Mock assistant response')).toHaveStyle({ textAlign: 'right' });
  });
});

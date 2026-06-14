import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ChatContent } from './ChatContent';
import translations from '../i18n';
import { sendChatMessage } from '../services/chatService';

vi.mock('../services/chatService', () => ({
  sendChatMessage: vi.fn(async () => ({
    response: 'Mock assistant response',
    sessionId: 'session-1',
    messageCount: 1,
    lastActivityAt: '2026-06-08T00:00:00Z',
  })),
  clearCurrentSession: vi.fn(),
}));

const mockedSendChatMessage = vi.mocked(sendChatMessage);

beforeEach(() => {
  mockedSendChatMessage.mockResolvedValue({
    response: 'Mock assistant response',
    sessionId: 'session-1',
    messageCount: 1,
    lastActivityAt: '2026-06-08T00:00:00Z',
  });
});

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
    expect(screen.getByText('Mock assistant response').closest('.chat-bubble')).toHaveStyle({
      textAlign: 'left',
    });
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
    expect(screen.getByText('Mock assistant response').closest('.chat-bubble')).toHaveStyle({
      textAlign: 'right',
    });
  });

  test('renders tagged assistant responses with Arabic content through chat flow', async () => {
    mockedSendChatMessage.mockResolvedValueOnce({
      response:
        'مقدمة <lawyer_notes>هذه ملاحظة مهمة</lawyer_notes><legal_document>هذه وثيقة قانونية</legal_document><system_trace>تفاصيل داخلية</system_trace> خاتمة',
      sessionId: 'session-1',
      messageCount: 1,
      lastActivityAt: '2026-06-08T00:00:00Z',
    });

    render(<ChatContent t={translations.ar} language="ar" />);

    fireEvent.change(screen.getByPlaceholderText('اكتب رسالتك...'), {
      target: { value: 'ما هو الرد؟' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'إرسال' }));

    await waitFor(() => {
      expect(screen.getByText('هذه ملاحظة مهمة')).toBeInTheDocument();
    });

    expect(screen.getByText('مقدمة')).toBeInTheDocument();
    expect(screen.getByText('خاتمة')).toBeInTheDocument();
    expect(screen.getByText('هذه ملاحظة مهمة')).toHaveStyle({ fontWeight: 'bold' });
    expect(screen.getByText('هذه وثيقة قانونية')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /system trace/i })).toBeInTheDocument();
    expect(screen.queryByText('تفاصيل داخلية')).not.toBeInTheDocument();
    expect(screen.queryByText(/lawyer_notes|legal_document|system_trace/)).not.toBeInTheDocument();
  });
});

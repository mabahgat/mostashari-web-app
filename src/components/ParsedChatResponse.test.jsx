import { fireEvent, render, screen } from '@testing-library/react';
import { ParsedChatResponse } from './ParsedChatResponse';

describe('ParsedChatResponse', () => {
  let consoleWarnSpy;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  test('renders plain text without modification', () => {
    render(<ParsedChatResponse text="Simple response text" />);

    expect(screen.getByText('Simple response text')).toBeInTheDocument();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test('renders tagged sections with expected formatting and strips tags', () => {
    render(
      <ParsedChatResponse
        text="Intro text <lawyer_notes>Important note</lawyer_notes><legal_document>Legal clause</legal_document> closing text"
      />
    );

    expect(screen.getByText('Intro text')).toBeInTheDocument();
    expect(screen.getByText('closing text')).toBeInTheDocument();
    expect(screen.getByText('Important note')).toHaveStyle({ fontWeight: 'bold' });
    expect(screen.getByText('Legal clause')).toBeInTheDocument();
    expect(screen.queryByText(/lawyer_notes|legal_document/)).not.toBeInTheDocument();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test('renders Arabic text correctly across mixed sections', () => {
    render(
      <ParsedChatResponse
        text="مقدمة <lawyer_notes>ملاحظة قانونية مهمة</lawyer_notes><legal_document>هذا نص قانوني باللغة العربية</legal_document> خاتمة"
      />
    );

    expect(screen.getByText('مقدمة')).toBeInTheDocument();
    expect(screen.getByText('خاتمة')).toBeInTheDocument();
    expect(screen.getByText('ملاحظة قانونية مهمة')).toHaveStyle({ fontWeight: 'bold' });
    expect(screen.getByText('هذا نص قانوني باللغة العربية')).toBeInTheDocument();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test('shows system trace only behind a collapsible toggle in dev mode', () => {
    render(
      <ParsedChatResponse text="Visible text<system_trace>internal trace details</system_trace>" />
    );

    expect(screen.getByText('Visible text')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /system trace/i })).toBeInTheDocument();
    expect(screen.queryByText('internal trace details')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /system trace/i }));

    expect(screen.getByText('internal trace details')).toBeInTheDocument();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test('keeps unknown tags as plain text and ignores empty input safely', () => {
    const { rerender } = render(
      <ParsedChatResponse text="Before <unknown_tag>raw content</unknown_tag> After" />
    );

    expect(screen.getByText('Before <unknown_tag>raw content</unknown_tag> After')).toBeInTheDocument();

    rerender(<ParsedChatResponse text="" />);

    expect(screen.queryByText(/unknown_tag/)).not.toBeInTheDocument();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test('ignores empty known sections and logs a warning', () => {
    render(
      <ParsedChatResponse
        text="Start <lawyer_notes>   </lawyer_notes><legal_document>وثيقة صحيحة</legal_document> End"
      />
    );

    expect(screen.queryByText('   ')).not.toBeInTheDocument();
    expect(screen.getByText('وثيقة صحيحة')).toBeInTheDocument();
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('End')).toBeInTheDocument();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'ParsedChatResponse: missing content for <lawyer_notes> section, ignoring it.',
      'Start <lawyer_notes>   </lawyer_notes><legal_document>وثيقة صحيحة</legal_document> End'
    );
  });

  test('falls back to raw text and logs a warning when known tags are malformed', () => {
    const malformedText = 'مقدمة <lawyer_notes>محتوى غير مكتمل <legal_document>نص قانوني</legal_document>';

    render(<ParsedChatResponse text={malformedText} />);

    expect(screen.getByText(malformedText)).toBeInTheDocument();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'ParsedChatResponse: response did not match the expected tagged structure, rendering raw text.',
      malformedText
    );
  });
});

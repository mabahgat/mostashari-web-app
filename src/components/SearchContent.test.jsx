import { render, screen } from '@testing-library/react';
import { SearchContent } from './SearchContent';
import translations from '../i18n';

describe('SearchContent rendering states', () => {
  test('shows loading state', () => {
    render(
      <SearchContent
        results={[]}
        language="en"
        loading={true}
        error={null}
        t={translations.en}
      />
    );

    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  test('shows error state', () => {
    render(
      <SearchContent
        results={[]}
        language="en"
        loading={false}
        error={'Something went wrong'}
        t={translations.en}
      />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  test('renders grouped results with count', () => {
    const results = [
      {
        title: 'Law A',
        description: 'Result one',
        subtitle: 'Section 1',
        subtitle2: '',
        highlights: 'highlighted text',
      },
      {
        title: 'Law A',
        description: 'Result two',
        subtitle: 'Section 2',
        subtitle2: '',
        highlights: 'another highlighted text',
      },
    ];

    render(
      <SearchContent
        results={results}
        language="en"
        loading={false}
        error={null}
        t={translations.en}
      />
    );

    expect(screen.getByText('Found 2 results')).toBeInTheDocument();
    expect(screen.getByText(/Law A/)).toBeInTheDocument();
    expect(screen.getByText('Result one')).toBeInTheDocument();
    expect(screen.getByText('Result two')).toBeInTheDocument();
  });
});

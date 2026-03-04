import { useState } from 'react';
import { searchAzure } from '../services/azureSearchService';

export const useSearch = (translations, searchType = 'REG') => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim()) {
      setLoading(true);
      setError(null);
      setResults([]); // Reset results before search
      setHasSearched(true);
      
      try {
        const searchResults = await searchAzure(input, searchType);
        setResults(searchResults);
        console.log('Search results:', searchResults);
      } catch (err) {
        setError(translations.errorMessage);
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNewSearch = () => {
    setInput('');
    setResults([]);
    setHasSearched(false);
    setError(null);
  };

  return {
    input,
    setInput,
    results,
    setResults,
    hasSearched,
    loading,
    error,
    handleSubmit,
    handleNewSearch,
  };
};
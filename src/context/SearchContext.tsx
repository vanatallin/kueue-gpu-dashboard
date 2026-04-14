import { createContext, useContext, useState, type ReactNode } from 'react';

interface SearchContextValue {
  query: string;
  setQuery: (query: string) => void;
  clearQuery: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');

  return (
    <SearchContext.Provider value={{ query, setQuery, clearQuery: () => setQuery('') }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

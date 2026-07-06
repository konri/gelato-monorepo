import {useState, useMemo} from 'react';

interface UseSearchProps<T> {
  data: T[];
  searchFields: (item: T) => string[];
}

export const useSearch = <T,>({data, searchFields}: UseSearchProps<T>) => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(item =>
      searchFields(item).some(field => field.toLowerCase().includes(query))
    );
  }, [data, searchQuery, searchFields]);

  const openSearch = () => setIsSearchActive(true);
  
  const closeSearch = () => {
    setIsSearchActive(false);
    setSearchQuery('');
  };

  return {
    isSearchActive,
    searchQuery,
    setSearchQuery,
    filteredData,
    openSearch,
    closeSearch,
  };
};

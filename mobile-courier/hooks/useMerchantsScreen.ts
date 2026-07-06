import { useCallback, useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useMerchants } from '@/hooks/useMerchants';

export const useMerchantsScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: categoriesData,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  const {
    data: merchantsData,
    loading: merchantsLoading,
    error: merchantsError,
  } = useMerchants({
    params: {
      search: searchQuery,
      category: selectedCategory,
      page: 1,
      pageSize: 20,
    },
  });

  const handleSearch = useCallback(() => {
    setSearchQuery(searchText);
  }, [searchText]);

  const handleCategoryPress = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
  }, []);

  const handleRefresh = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('');
    setSearchText('');
  }, []);

  const isLoading = merchantsLoading || categoriesLoading;
  const hasError = merchantsError || categoriesError;

  return {
    searchText,
    setSearchText,
    selectedCategory,
    categoriesData,
    categoriesLoading,
    merchantsData,
    isLoading,
    hasError,
    merchantsError,
    categoriesError,
    handleSearch,
    handleCategoryPress,
    handleRefresh,
  };
};

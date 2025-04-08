import React, { createContext, useState, useContext, ReactNode } from 'react';
import { SearchContextType } from '../types/types';



const defaultContext: SearchContextType = {
  searchParams: {
    country: '',
    state: '',
    city: '',
    startDate: '',
    endDate: '',
    pax: 1,
    duration: 'all',
    cityId: ''
  },
  setSearchParams: () => {},
  setCityId: () => {}
};

const SearchContext = createContext<SearchContextType>(defaultContext);

export const SearchProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [searchParams, setSearchParams] = useState(defaultContext.searchParams);

  const updateSearchParams = (params: Partial<typeof defaultContext.searchParams>) => {
    setSearchParams(prev => ({
      ...prev,
      ...params
    }));
  };

  const setCityId = (id: string) => {
    setSearchParams(prev => ({
      ...prev,
      cityId: id
    }));
  };

  return (
    <SearchContext.Provider value={{ 
      searchParams, 
      setSearchParams: updateSearchParams,
      setCityId
    }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearchContext = () => useContext(SearchContext);
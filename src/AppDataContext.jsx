import React, { createContext, useEffect, useMemo, useState, useCallback } from 'react';
import { API_BASE } from '../constants/Api';

export const AppDataContext = createContext({
  categories: [],
  categoriesLoading: false,
  categoriesError: null,
  refreshCategories: () => {},
});

export function AppDataProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to load categories (${res.status})`);
      }
      const data = await res.json();
      const items = Array.isArray(data?.categories) ? data.categories : [];
      setCategories(items);
    } catch (err) {
      setCategoriesError(err?.message || 'Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const value = useMemo(() => ({
    categories,
    categoriesLoading,
    categoriesError,
    refreshCategories: fetchCategories,
  }), [categories, categoriesLoading, categoriesError, fetchCategories]);

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}




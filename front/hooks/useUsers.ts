import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/endpoints/users';
import { useAuth } from '@/contexts/AuthContext';
import type { PublicUserRespond, UserSearchDto } from '@/types';

export function useUsers() {
  const { token } = useAuth();

  return useQuery<PublicUserRespond[]>({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
    enabled: !!token,
  });
}

export function useSearchUsers(query: string, debounceMs = 300) {
  const { token } = useAuth();
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [query, debounceMs]);

  const cleanQuery = debouncedQuery.trim();
  const isSearchActive = cleanQuery.length > 0;

  const queryResult = useQuery<UserSearchDto[]>({
    queryKey: ['users', 'search', cleanQuery],
    queryFn: () => usersApi.search(cleanQuery),
    enabled: !!token && isSearchActive,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });

  return {
    ...queryResult,
    debouncedQuery,
    isDebouncing: query.trim() !== cleanQuery,
    isSearchActive,
  };
}

import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/endpoints/users';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRespond } from '@/types';

export function useUsers() {
  const { token } = useAuth();

  return useQuery<UserRespond[]>({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
    enabled: !!token,
  });
}

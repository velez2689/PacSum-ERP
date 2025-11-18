/**
 * Organization hook
 * Manages organization state and operations
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Organization, CreateOrganizationData, UpdateOrganizationData } from '@/types/organizations';
import { useAuth } from './useAuth';

export function useOrganization(orgId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentOrgId, setCurrentOrgId] = useState<string | undefined>(orgId || user?.organizationId);

  useEffect(() => {
    if (!currentOrgId && user?.organizationId) {
      setCurrentOrgId(user.organizationId);
    }
  }, [user, currentOrgId]);

  /**
   * Fetch organization details
   */
  const {
    data: organization,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['organization', currentOrgId],
    queryFn: async (): Promise<Organization> => {
      if (!currentOrgId) throw new Error('No organization ID');
      const response = await apiClient.get<Organization>(`/organizations/${currentOrgId}`);
      if (!response.data) throw new Error('No organization data received');
      return response.data;
    },
    enabled: !!currentOrgId,
  });

  /**
   * Fetch user's organizations
   */
  const {
    data: organizations,
    isLoading: isLoadingOrganizations,
  } = useQuery({
    queryKey: ['organizations'],
    queryFn: async (): Promise<Organization[]> => {
      const response = await apiClient.get<Organization[]>('/organizations');
      if (!response.data) throw new Error('No organizations data received');
      return response.data;
    },
  });

  /**
   * Create organization mutation
   */
  const createOrganization = useMutation({
    mutationFn: async (data: CreateOrganizationData) => {
      const response = await apiClient.post<Organization>('/organizations', data);
      if (!response.data) throw new Error('No organization data received');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      if (data?.id) {
        setCurrentOrgId(data.id);
      }
    },
  });

  /**
   * Update organization mutation
   */
  const updateOrganization = useMutation({
    mutationFn: async (data: UpdateOrganizationData) => {
      if (!currentOrgId) throw new Error('No organization selected');
      const response = await apiClient.patch<Organization>(`/organizations/${currentOrgId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', currentOrgId] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  /**
   * Delete organization mutation
   */
  const deleteOrganization = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/organizations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      if (currentOrgId === currentOrgId) {
        setCurrentOrgId(undefined);
      }
    },
  });

  /**
   * Switch to different organization
   */
  const switchOrganization = (id: string): void => {
    setCurrentOrgId(id);
  };

  return {
    organization,
    organizations,
    isLoading,
    isLoadingOrganizations,
    error,
    currentOrgId,
    createOrganization: createOrganization.mutate,
    updateOrganization: updateOrganization.mutate,
    deleteOrganization: deleteOrganization.mutate,
    switchOrganization,
    isCreating: createOrganization.isPending,
    isUpdating: updateOrganization.isPending,
    isDeleting: deleteOrganization.isPending,
  };
}

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClientsList } from '@/components/dashboard/ClientsList';
import { ClientForm } from '@/components/forms/ClientForm';
import { apiClient } from '@/lib/api-client';
import type { CreateClientData } from '@/types/clients';

/**
 * Clients list page
 */
export default function ClientsPage({ params }: { params: { orgId: string } }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateClient = async (data: CreateClientData): Promise<void> => {
    try {
      setIsLoading(true);
      await apiClient.post(`/organizations/${params.orgId}/clients`, data);
      setIsDialogOpen(false);
      // TODO: Refresh clients list
    } catch (error) {
      console.error('Failed to create client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Clients</h1>
          <p className="text-slate-400 mt-1">Manage your client accounts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="primary">
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
            </DialogHeader>
            <ClientForm
              onSubmit={handleCreateClient}
              onCancel={() => setIsDialogOpen(false)}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      <ClientsList orgId={params.orgId} />
    </div>
  );
}

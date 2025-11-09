'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, FolderOpen } from 'lucide-react';

/**
 * Documents page
 */
export default function DocumentsPage({ params }: { params: { orgId: string } }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Documents</h1>
          <p className="text-slate-400 mt-1">Manage your financial documents</p>
        </div>
        <Button variant="primary">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoices
            </CardTitle>
            <CardDescription>24 documents</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" className="w-full justify-start">
              View all invoices
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Receipts
            </CardTitle>
            <CardDescription>156 documents</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" className="w-full justify-start">
              View all receipts
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Tax Documents
            </CardTitle>
            <CardDescription>12 documents</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" className="w-full justify-start">
              View tax documents
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-center py-12">
            No documents uploaded yet. Upload your first document to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

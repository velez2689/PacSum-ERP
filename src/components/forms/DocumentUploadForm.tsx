'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Form, FormField, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Upload, File, X } from 'lucide-react';
import { formatFileSize } from '@/utils/formatting';

interface DocumentUploadFormProps {
  onSubmit: (file: File, metadata: DocumentMetadata) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface DocumentMetadata {
  category: string;
  description: string;
  tags: string[];
}

/**
 * Document upload form component
 */
export function DocumentUploadForm({ onSubmit, onCancel, isLoading }: DocumentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    category: 'invoice',
    description: '',
    tags: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setErrors({ file: 'File size must be less than 10MB' });
        return;
      }
      setFile(selectedFile);
      setErrors({});
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setMetadata((prev) => ({ ...prev, [name]: value }));
  };

  const handleRemoveFile = (): void => {
    setFile(null);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!file) newErrors.file = 'Please select a file';
    if (!metadata.category) newErrors.category = 'Category is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validate() || !file) return;
    await onSubmit(file, metadata);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <FormField>
        <FormLabel htmlFor="file" required>
          File
        </FormLabel>
        <FormControl>
          <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
            {file ? (
              <div className="flex items-center justify-between bg-slate-800 rounded p-3">
                <div className="flex items-center gap-3">
                  <File className="h-8 w-8 text-blue-400" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{file.name}</p>
                    <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-400 mb-2">
                  Click to browse or drag and drop
                </p>
                <p className="text-xs text-slate-500">
                  PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (max 10MB)
                </p>
                <input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <label htmlFor="file">
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => document.getElementById('file')?.click()}
                  >
                    Select File
                  </Button>
                </label>
              </div>
            )}
          </div>
        </FormControl>
        <FormMessage>{errors.file}</FormMessage>
      </FormField>

      <FormField>
        <FormLabel htmlFor="category" required>
          Category
        </FormLabel>
        <FormControl>
          <Select
            id="category"
            name="category"
            value={metadata.category}
            onChange={handleChange}
            error={!!errors.category}
          >
            <option value="invoice">Invoice</option>
            <option value="receipt">Receipt</option>
            <option value="contract">Contract</option>
            <option value="tax">Tax Document</option>
            <option value="statement">Bank Statement</option>
            <option value="other">Other</option>
          </Select>
        </FormControl>
        <FormMessage>{errors.category}</FormMessage>
      </FormField>

      <FormField>
        <FormLabel htmlFor="description">Description</FormLabel>
        <FormControl>
          <Input
            id="description"
            name="description"
            value={metadata.description}
            onChange={handleChange}
            placeholder="Brief description of the document"
          />
        </FormControl>
        <FormDescription>Optional description for easy identification</FormDescription>
      </FormField>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={isLoading} disabled={!file}>
          Upload Document
        </Button>
      </div>
    </Form>
  );
}

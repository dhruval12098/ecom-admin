'use client';

import React from "react"

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;


export default function AddCategoryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    status: 'active',
  });
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Category name is required.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-');
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: slug,
          imageUrl: imageUrl || null
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Create failed');
      }
      toast({
        title: 'Success',
        description: 'Category created successfully.',
      });
      const createdId = result?.data?.id;
      if (createdId) {
        router.push(`/admin/categories/${createdId}`);
        return;
      }
      router.push('/admin/categories');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create category.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2 MB.',
        variant: 'destructive',
      });
      event.currentTarget.value = '';
      return;
    }
    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('fileName', file.name);
      formDataUpload.append('contentType', file.type);
      const response = await fetch(`${API_BASE_URL}/api/categories/upload`, {
        method: 'POST',
        body: formDataUpload,
      });
      const result = await response.json();
      if (result.success) {
        setImageUrl(result.data.publicUrl);
        toast({
          title: 'Success',
          description: 'Image uploaded successfully.',
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Image upload failed.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/categories">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Add New Category</h1>
            <p className="text-muted-foreground text-sm mt-1">Create a new product category</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="bg-card border border-border rounded-lg p-6">
            <label className="block text-sm font-semibold text-foreground mb-4">Category Image</label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition cursor-pointer">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Drag and drop your image here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to select</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-3"
                disabled={isUploading}
              />
              {imageUrl && (
                <p className="text-xs text-muted-foreground mt-2">Image selected</p>
              )}
            </div>
          </div>

          {/* Category Information */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Category Information</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Main Course"
                required
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </Button>
            <Link href="/admin/categories">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

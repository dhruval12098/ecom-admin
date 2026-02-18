'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Trash2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function ReviewsPage() {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [productName, setProductName] = useState<string>('');
  const [viewLoading, setViewLoading] = useState(false);
  const pageSize = 10;

  const fetchReviews = async (pageNumber = 1, query = search) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/api/product-reviews/admin?page=${pageNumber}&limit=${pageSize}&search=${encodeURIComponent(query)}`
      );
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch reviews');
      setRows(result.data?.rows || []);
      setTotal(result.data?.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(page, search);
  }, [page]);

  useEffect(() => {
    const id = setTimeout(() => {
      setPage(1);
      fetchReviews(1, search);
    }, 400);
    return () => clearTimeout(id);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reviews</h1>
          <p className="text-muted-foreground text-xs mt-1">Manage customer reviews</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-xs relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md bg-card border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Reviewer</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Rating</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Verified</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Status</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Date</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td className="px-4 py-4 text-[11px] text-muted-foreground" colSpan={6}>
                      Loading reviews...
                    </td>
                  </tr>
                )}
                {!isLoading && error && (
                  <tr>
                    <td className="px-4 py-4 text-[11px] text-destructive" colSpan={6}>
                      {error}
                    </td>
                  </tr>
                )}
                {!isLoading && !error && rows.length === 0 && (
                  <tr>
                    <td className="px-4 py-4 text-[11px] text-muted-foreground" colSpan={6}>
                      No reviews found.
                    </td>
                  </tr>
                )}
                {!isLoading && !error && rows.map((review) => (
                  <tr key={review.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-2 text-foreground">
                      <div className="font-medium">{review.reviewer_name || '-'}</div>
                      <div className="text-muted-foreground">{review.reviewer_email || '-'}</div>
                    </td>
                    <td className="px-4 py-2 text-foreground">{review.rating || '-'}</td>
                    <td className="px-4 py-2">
                      {review.order_id && review.order_item_id ? (
                        <Badge className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          Unverified
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <Badge className={review.is_published ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'}>
                        {review.is_published ? 'Published' : 'Hidden'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {review.created_at ? new Date(review.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setSelectedReview(review);
                            setViewOpen(true);
                            setProductName('');
                            if (review?.product_id) {
                              try {
                                setViewLoading(true);
                                const res = await fetch(`${API_BASE_URL}/api/products/${review.product_id}`);
                                const json = await res.json();
                                if (json?.success && json?.data) {
                                  setProductName(json.data.name || '');
                                }
                              } finally {
                                setViewLoading(false);
                              }
                            }
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await fetch(`${API_BASE_URL}/api/product-reviews/${review.id}/publish`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ is_published: !review.is_published })
                            });
                            fetchReviews(page, search);
                          }}
                        >
                          {review.is_published ? 'Hide' : 'Publish'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive/80"
                          onClick={async () => {
                            if (!window.confirm('Delete this review?')) return;
                            await fetch(`${API_BASE_URL}/api/product-reviews/${review.id}`, { method: 'DELETE' });
                            fetchReviews(page, search);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Prev
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>Read-only view of this review.</DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-3 text-sm text-foreground">
              <div>
                <div className="text-xs text-muted-foreground">Reviewer</div>
                <div className="font-medium">{selectedReview.reviewer_name || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Product</div>
                <div className="font-medium">
                  {viewLoading ? 'Loading...' : productName || `Product #${selectedReview.product_id || '-'}`}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Order ID</div>
                <div className="font-medium">{selectedReview.order_id || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Rating</div>
                <div className="font-medium">{selectedReview.rating || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Review</div>
                <div className="font-medium">{selectedReview.review_text || '-'}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

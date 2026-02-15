'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Upload, Save, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


type TabType = 'hero' | 'about' | 'contact' | 'trends' | 'offer';

type HeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  imageUrlFullScreen: string;
  imageUrlSmallScreen: string;
  buttonText: string;
  buttonLink: string;
};

type NewHeroSlide = {
  imageUrl: string;
  mobileImageUrl: string;
};

export default function ContentPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabType>('hero');
  const [heroSliders, setHeroSliders] = useState<HeroSlide[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [isTrendsLoading, setIsTrendsLoading] = useState(false);
  const [isAddingTrend, setIsAddingTrend] = useState(false);
  const [isEditingTrend, setIsEditingTrend] = useState(false);
  const [editTrend, setEditTrend] = useState<any | null>(null);
  const [newTrend, setNewTrend] = useState({
    title: '',
    description: '',
    imageUrl: ''
  });
  const [trendUploadError, setTrendUploadError] = useState('');
  const [uploadingTrendId, setUploadingTrendId] = useState<number | 'new' | null>(null);
  const [savingTrendId, setSavingTrendId] = useState<number | 'new' | null>(null);

  const [offerBar, setOfferBar] = useState({
    message: '',
    linkText: '',
    linkUrl: '',
    isActive: true,
    speed: 20
  });
  const [isOfferLoading, setIsOfferLoading] = useState(false);
  const [isOfferSaving, setIsOfferSaving] = useState(false);
  const [offerLoaded, setOfferLoaded] = useState(false);
  
  // Hero slide form states
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [newSlide, setNewSlide] = useState<NewHeroSlide>({
    imageUrl: '',
    mobileImageUrl: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'hero' || tab === 'about' || tab === 'contact' || tab === 'trends' || tab === 'offer') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const setTab = (tab: TabType) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const fetchTrends = async () => {
    setIsTrendsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/trends`);
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setTrends(result.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load trends.',
        variant: 'destructive',
      });
    } finally {
      setIsTrendsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'trends') return;
    if (trends.length > 0) return;
    fetchTrends();
  }, [activeTab, trends.length, toast]);

  const fetchOfferBar = async () => {
    setIsOfferLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/announcement-bar`);
      const result = await response.json();
      if (result.success && result.data) {
        setOfferBar({
          message: result.data.message || '',
          linkText: result.data.link_text || '',
          linkUrl: result.data.link_url || '',
          isActive: result.data.is_active !== false,
          speed: Number(result.data.speed || 20)
        });
      }
      setOfferLoaded(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load offer bar.',
        variant: 'destructive',
      });
    } finally {
      setIsOfferLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'offer') return;
    if (offerLoaded) return;
    fetchOfferBar();
  }, [activeTab, offerLoaded]);


  // Add state for confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<number | null>(null);

  const removeBanner = async (id: number) => {
    setBannerToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDeleteBanner = async () => {
    if (bannerToDelete !== null) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/hero-slides/${bannerToDelete}`, {
          method: 'DELETE',
        });
        
        const result = await response.json();
        
        if (result.success) {
          setHeroSliders(heroSliders.filter(banner => banner.id !== bannerToDelete));
          toast({
            title: "Success",
            description: "Banner deleted successfully.",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || 'Failed to delete slide',
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: 'Error deleting slide: ' + (error as Error).message,
          variant: "destructive",
        });
      } finally {
        setShowDeleteDialog(false);
        setBannerToDelete(null);
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, target: 'desktop' | 'mobile' = 'desktop') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('contentType', file.type);
        formData.append('folder', 'trends');

        const response = await fetch(`${API_BASE_URL}/api/storage`, {
          method: 'POST',
          body: formData,
        });

      const result = await response.json();
      
      if (result.success) {
        if (target === 'mobile') {
          setNewSlide((prev) => ({
            ...prev,
            mobileImageUrl: result.data.publicUrl
          }));
        } else {
          setNewSlide((prev) => ({
            ...prev,
            imageUrl: result.data.publicUrl
          }));
        }
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (error) {
      setUploadError('Upload failed: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };


  const handleAddSlide = async () => {
    if (!newSlide.imageUrl) {
      setUploadError('Please upload an image');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/hero-slides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: newSlide.imageUrl,
          mobileImageUrl: newSlide.mobileImageUrl || null
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Fetch updated list from API to ensure consistency
        const updatedResponse = await fetch(`${API_BASE_URL}/api/hero-slides`);
        const updatedResult = await updatedResponse.json();
        
        if (updatedResult.success) {
          // Transform API response to match frontend format
          const transformedSlides = updatedResult.data.map((slide: any) => ({
            id: slide.id,
            title: slide.title || 'Hero Banner',
            subtitle: slide.subtitle || 'Ecommerce Banner',
            imageUrlFullScreen: slide.image_url || slide.imageUrl,
            imageUrlSmallScreen: slide.mobile_image_url || slide.imageUrl || slide.image_url,
            buttonText: slide.button_text || slide.buttonText || 'Shop Now',
            buttonLink: slide.button_link || slide.buttonLink || '/products'
          }));
          
          setHeroSliders(transformedSlides);
          toast({
            title: "Success",
            description: "Banner added successfully.",
          });
        }
        
        setIsAddingSlide(false);
        setNewSlide({
          imageUrl: '',
          mobileImageUrl: ''
        });
        setUploadError('');
      } else {
        setUploadError(result.error || 'Failed to add slide');
        toast({
          title: "Error",
          description: result.error || 'Failed to add slide',
          variant: "destructive",
        });
      }
    } catch (error) {
      setUploadError('Failed to add slide: ' + (error as Error).message);
      toast({
        title: "Error",
        description: 'Failed to add slide: ' + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const cancelAddSlide = () => {
    setIsAddingSlide(false);
    setNewSlide({
      imageUrl: '',
      mobileImageUrl: ''
    });
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (mobileFileInputRef.current) {
      mobileFileInputRef.current.value = '';
    }
  };

  // Load hero slides from API when component mounts
  const fetchHeroSlides = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hero-slides`);
      const result = await response.json();
      
      if (result.success) {
        // Transform API response to match frontend format
        const transformedSlides = result.data.map((slide: any) => ({
          id: slide.id,
          title: slide.title || 'Hero Banner',
          subtitle: slide.subtitle || 'Ecommerce Banner',
          imageUrlFullScreen: slide.image_url || slide.imageUrl,
          imageUrlSmallScreen: slide.mobile_image_url || slide.imageUrl || slide.image_url,
          buttonText: slide.button_text || slide.buttonText || 'Shop Now',
          buttonLink: slide.button_link || slide.buttonLink || '/products'
        }));
        
        setHeroSliders(transformedSlides);
      }
    } catch (error) {
      console.error('Error fetching hero slides:', error);
    }
  };

  useEffect(() => {
    fetchHeroSlides();
    fetchTrends();
  }, []);

  const removeTrend = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trends/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        setTrends(trends.filter(trend => trend.id !== id));
        toast({
          title: 'Success',
          description: 'Trend deleted successfully.',
        });
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete trend.',
        variant: 'destructive',
      });
    }
  };

  const handleTrendImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, trendId: number | 'new') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingTrendId(trendId);
    setTrendUploadError('');
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('contentType', file.type);
        formData.append('folder', 'trends');

        const response = await fetch(`${API_BASE_URL}/api/storage`, {
          method: 'POST',
          body: formData,
        });

      const result = await response.json();
      if (result.success) {
        const imageUrl = result.data.publicUrl;
        if (trendId === 'new') {
          setNewTrend(prev => ({ ...prev, imageUrl }));
        } else {
          setTrends(prev => prev.map(t => t.id === trendId ? { ...t, image_url: imageUrl } : t));
        }
        toast({
          title: 'Success',
          description: 'Image uploaded successfully.',
        });
      } else {
        setTrendUploadError(result.error || 'Upload failed');
        toast({
          title: 'Error',
          description: result.error || 'Upload failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setTrendUploadError('Upload failed: ' + (error as Error).message);
      toast({
        title: 'Error',
        description: 'Upload failed: ' + (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setUploadingTrendId(null);
    }
  };

  const handleAddTrend = async () => {
    if (!newTrend.title || !newTrend.description || !newTrend.imageUrl) {
      toast({
        title: 'Error',
        description: 'Please fill all fields and upload an image.',
        variant: 'destructive',
      });
      return;
    }
    setSavingTrendId('new');
    try {
      const response = await fetch(`${API_BASE_URL}/api/trends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTrend.title,
          description: newTrend.description,
          imageUrl: newTrend.imageUrl,
          sortOrder: trends.length
        })
      });
      const result = await response.json();
      if (result.success) {
        setTrends(prev => [...prev, result.data]);
        setNewTrend({ title: '', description: '', imageUrl: '' });
        setIsAddingTrend(false);
        toast({
          title: 'Success',
          description: 'Trend added successfully.',
        });
      } else {
        throw new Error(result.error || 'Add failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add trend.',
        variant: 'destructive',
      });
    } finally {
      setSavingTrendId(null);
    }
  };

  const handleSaveTrend = async (trendId: number) => {
    const trend = trends.find(t => t.id === trendId);
    if (!trend) return;
    setSavingTrendId(trendId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/trends/${trendId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trend.title,
          description: trend.description,
          imageUrl: trend.image_url,
          sortOrder: trends.findIndex(t => t.id === trendId)
        })
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Save failed');
      }
      toast({
        title: 'Success',
        description: 'Trend updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save trend.',
        variant: 'destructive',
      });
      } finally {
        setSavingTrendId(null);
      }
    };

  const openEditTrend = (trend: any) => {
    setEditTrend({
      id: trend.id,
      title: trend.title || '',
      description: trend.description || '',
      imageUrl: trend.image_url || ''
    });
    setIsEditingTrend(true);
  };

  const handleEditTrendImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editTrend) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingTrendId(editTrend.id);
    setTrendUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('contentType', file.type);
      formData.append('folder', 'trends');

      const response = await fetch(`${API_BASE_URL}/api/storage`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        const imageUrl = result.data.publicUrl;
        setEditTrend((prev: any) => ({ ...prev, imageUrl }));
        toast({
          title: 'Success',
          description: 'Image uploaded successfully.',
        });
      } else {
        setTrendUploadError(result.error || 'Upload failed');
        toast({
          title: 'Error',
          description: result.error || 'Upload failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setTrendUploadError('Upload failed: ' + (error as Error).message);
      toast({
        title: 'Error',
        description: 'Upload failed: ' + (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setUploadingTrendId(null);
    }
  };

  const handleSaveOfferBar = async () => {
    if (!offerBar.message.trim()) {
      toast({
        title: 'Validation',
        description: 'Offer message is required.',
        variant: 'destructive',
      });
      return;
    }

    setIsOfferSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/announcement-bar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: offerBar.message,
          linkText: offerBar.linkText || null,
          linkUrl: offerBar.linkUrl || null,
          isActive: offerBar.isActive,
          speed: Number(offerBar.speed || 20)
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to save offer bar');
      }

      toast({
        title: 'Saved',
        description: 'Offer bar updated successfully.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to save offer bar.',
        variant: 'destructive',
      });
    } finally {
      setIsOfferSaving(false);
    }
  };

  const handleSaveEditTrend = async () => {
    if (!editTrend) return;
    setSavingTrendId(editTrend.id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/trends/${editTrend.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTrend.title,
          description: editTrend.description,
          imageUrl: editTrend.imageUrl,
          sortOrder: trends.findIndex(t => t.id === editTrend.id)
        })
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Save failed');
      }
      setTrends(prev => prev.map(t => t.id === editTrend.id ? { ...t, title: editTrend.title, description: editTrend.description, image_url: editTrend.imageUrl } : t));
      toast({
        title: 'Success',
        description: 'Trend updated successfully.',
      });
      setIsEditingTrend(false);
      setEditTrend(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save trend.',
        variant: 'destructive',
      });
    } finally {
      setSavingTrendId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Content Management</h1>
            <p className="text-muted-foreground mt-1">Manage website content and sections</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex gap-4">
                {(['hero', 'about', 'contact', 'trends', 'offer'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTab(tab)}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Tab */}
        {activeTab === 'hero' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Hero Slider Banners</h2>
              <div className="flex gap-2">
                <Link href="/admin/content/hero-trash">
                  <Button variant="outline" className="gap-2 bg-transparent">
                    Trash
                  </Button>
                </Link>
                <Button 
                  className="gap-2 bg-primary" 
                  onClick={() => setIsAddingSlide(true)}
                  disabled={isAddingSlide}
                >
                  <Plus className="w-4 h-4" />
                  Add Banner
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              {/* Add New Banner Form */}
              {isAddingSlide && (
                <Card className="p-6 border-2 border-primary/20 bg-primary/5">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-foreground">Add New Banner</h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={cancelAddSlide}
                        className="gap-1"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Desktop Image *</Label>
                        <div className="mt-1 flex gap-3">
                          <Input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => handleImageUpload(e, 'desktop')}
                            accept="image/*"
                            className="flex-1"
                            disabled={isUploading}
                          />
                        </div>
                        {newSlide.imageUrl && (
                          <div className="mt-4">
                            <img 
                              src={newSlide.imageUrl} 
                              alt="Preview" 
                              className="w-full max-w-md h-48 rounded-lg object-cover border"
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <Label>Mobile Image (optional)</Label>
                        <div className="mt-1 flex gap-3">
                          <Input
                            type="file"
                            ref={mobileFileInputRef}
                            onChange={(e) => handleImageUpload(e, 'mobile')}
                            accept="image/*"
                            className="flex-1"
                            disabled={isUploading}
                          />
                        </div>
                        {newSlide.mobileImageUrl && (
                          <div className="mt-4">
                            <img 
                              src={newSlide.mobileImageUrl} 
                              alt="Mobile Preview" 
                              className="w-full max-w-md h-48 rounded-lg object-cover border"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {uploadError && (
                      <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
                        {uploadError}
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        className="gap-2 bg-primary" 
                        onClick={handleAddSlide}
                        disabled={isUploading || !newSlide.imageUrl}
                      >
                        <Save className="w-4 h-4" />
                        Save Banner
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
              
              {/* Existing Banners */}
              {heroSliders.map((banner) => (
                <Card key={banner.id} className="p-4">
                  <div className="flex gap-4">
                    <img 
                      src={banner.imageUrlSmallScreen || "/placeholder.svg"}
                      alt={banner.title}
                      className="w-32 h-24 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{banner.title}</h3>
                      <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Autoplay: 2 seconds
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/content/hero/${banner.id}`}>
                        <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeBanner(banner.id)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">About Us Sections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/admin/about/our-story">
                <Card className="p-5 border border-slate-200 rounded-lg shadow-sm hover:shadow transition-shadow cursor-pointer bg-white">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 text-xs">AS</div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Our Story</h3>
                      <p className="text-slate-500 text-sm mt-1">Manage the company's history and mission.</p>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link href="/admin/about/founders">
                <Card className="p-5 border border-slate-200 rounded-lg shadow-sm hover:shadow transition-shadow cursor-pointer bg-white">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 text-xs">F</div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Meet Our Founders</h3>
                      <p className="text-slate-500 text-sm mt-1">Add and edit founder profiles.</p>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link href="/admin/about/leadership">
                <Card className="p-5 border border-slate-200 rounded-lg shadow-sm hover:shadow transition-shadow cursor-pointer bg-white">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 text-xs">L</div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Our Leadership Team</h3>
                      <p className="text-slate-500 text-sm mt-1">Manage leadership team members.</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 gap-4">
              <Link href="/admin/contact/business-info">
                <Card className="p-5 border border-slate-200 rounded-lg shadow-sm hover:shadow transition-shadow cursor-pointer bg-white">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 text-xs">BI</div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Business Information</h3>
                      <p className="text-slate-500 text-sm mt-1">Edit address, email, phone, and hours shown on the Contact page.</p>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link href="/admin/contact/inquiries">
                <Card className="p-5 border border-slate-200 rounded-lg shadow-sm hover:shadow transition-shadow cursor-pointer bg-white">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 text-xs">IN</div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Inquiries</h3>
                      <p className="text-slate-500 text-sm mt-1">View Contact form submissions.</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Current Trends</h2>
              <Button className="gap-2 bg-primary" onClick={() => setIsAddingTrend(true)}>
                <Plus className="w-4 h-4" />
                Add Trend
              </Button>
            </div>
            {isAddingTrend && (
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                    <Input
                      value={newTrend.title}
                      onChange={(e) => setNewTrend({ ...newTrend, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                    <Textarea
                      value={newTrend.description}
                      onChange={(e) => setNewTrend({ ...newTrend, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">Image</label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleTrendImageUpload(e, 'new')}
                        disabled={uploadingTrendId === 'new'}
                      />
                      {newTrend.imageUrl && (
                        <img src={newTrend.imageUrl} alt="Trend" className="w-24 h-16 object-cover rounded" />
                      )}
                    </div>
                    {trendUploadError && (
                      <p className="text-destructive text-sm mt-2">{trendUploadError}</p>
                    )}
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <Button className="bg-primary" onClick={handleAddTrend} disabled={savingTrendId === 'new'}>
                      {savingTrendId === 'new' ? 'Saving...' : 'Save Trend'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingTrend(false)}>Cancel</Button>
                  </div>
                </div>
              </Card>
            )}
            <div className="grid gap-4">
              {isTrendsLoading && (
                <div className="text-muted-foreground">Loading trends...</div>
              )}
              {!isTrendsLoading && trends.map((trend) => (
                <Card key={trend.id} className="p-4">
                  <div className="flex gap-4">
                    <img 
                      src={trend.image_url || "/placeholder.svg"}
                      alt={trend.title}
                      className="w-32 h-24 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Title</label>
                          <Input
                            value={trend.title || ''}
                            onChange={(e) => setTrends(prev => prev.map(t => t.id === trend.id ? { ...t, title: e.target.value } : t))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Description</label>
                          <Textarea
                            value={trend.description || ''}
                            onChange={(e) => setTrends(prev => prev.map(t => t.id === trend.id ? { ...t, description: e.target.value } : t))}
                            rows={2}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-muted-foreground mb-1">Update Image</label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleTrendImageUpload(e, trend.id)}
                            disabled={uploadingTrendId === trend.id}
                          />
                        </div>
                      </div>
                    </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 bg-transparent"
                          onClick={() => handleSaveTrend(trend.id)}
                          disabled={savingTrendId === trend.id}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 bg-transparent"
                          onClick={() => openEditTrend(trend)}
                          disabled={savingTrendId === trend.id}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeTrend(trend.id)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Offer Tab */}
        {activeTab === 'offer' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Offer Bar (Header Marquee)</h2>
            </div>

            <Card className="p-5 space-y-4">
              {isOfferLoading ? (
                <div className="text-muted-foreground">Loading offer bar...</div>
              ) : (
                <>
                  <div>
                    <Label>Message *</Label>
                    <Textarea
                      value={offerBar.message}
                      onChange={(e) => setOfferBar({ ...offerBar, message: e.target.value })}
                      rows={3}
                      placeholder="e.g. Free shipping on orders over EUR 69"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Link Text</Label>
                      <Input
                        value={offerBar.linkText}
                        onChange={(e) => setOfferBar({ ...offerBar, linkText: e.target.value })}
                        placeholder="e.g. Shop now"
                      />
                    </div>
                    <div>
                      <Label>Link URL</Label>
                      <Input
                        value={offerBar.linkUrl}
                        onChange={(e) => setOfferBar({ ...offerBar, linkUrl: e.target.value })}
                        placeholder="https://example.com/collection"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <Label>Scroll Speed (seconds)</Label>
                      <Input
                        type="number"
                        min={6}
                        value={offerBar.speed}
                        onChange={(e) => setOfferBar({ ...offerBar, speed: Number(e.target.value || 20) })}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        id="offerActive"
                        type="checkbox"
                        checked={offerBar.isActive}
                        onChange={(e) => setOfferBar({ ...offerBar, isActive: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="offerActive">Show offer bar</Label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveOfferBar} disabled={isOfferSaving}>
                      {isOfferSaving ? 'Saving...' : 'Save Offer'}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

        {/* Confirmation Dialog for Delete */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the banner from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setShowDeleteDialog(false);
                  setBannerToDelete(null);
                }}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteBanner} className="bg-destructive hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={isEditingTrend} onOpenChange={(open) => {
            setIsEditingTrend(open);
            if (!open) setEditTrend(null);
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Trend</DialogTitle>
              </DialogHeader>
              {editTrend && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                    <Input
                      value={editTrend.title}
                      onChange={(e) => setEditTrend({ ...editTrend, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                    <Textarea
                      value={editTrend.description}
                      onChange={(e) => setEditTrend({ ...editTrend, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Image</label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleEditTrendImageUpload}
                        disabled={uploadingTrendId === editTrend.id}
                      />
                      {editTrend.imageUrl && (
                        <img src={editTrend.imageUrl} alt="Trend" className="w-24 h-16 object-cover rounded" />
                      )}
                    </div>
                    {trendUploadError && (
                      <p className="text-destructive text-sm mt-2">{trendUploadError}</p>
                    )}
                  </div>
                </div>
              )}
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsEditingTrend(false)}>Cancel</Button>
                <Button className="bg-primary" onClick={handleSaveEditTrend} disabled={!editTrend || savingTrendId === editTrend?.id}>
                  {savingTrendId === editTrend?.id ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </AdminLayout>
    );
  }

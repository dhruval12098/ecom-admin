'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import heroSliderData from '@/data/hero-slider.json';
import trendsData from '@/data/trends.json';

type TabType = 'hero' | 'about' | 'contact' | 'trends';

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<TabType>('hero');
  const [heroSliders, setHeroSliders] = useState(heroSliderData);
  const [trends, setTrends] = useState(trendsData);
  const [aboutContent, setAboutContent] = useState({
    title: 'About Us',
    description: 'Welcome to our ecommerce platform...',
    image: 'https://i.pinimg.com/1200x/45/63/32/456332c909f732da36000118c44943ab.jpg'
  });
  const [contactContent, setContactContent] = useState({
    email: 'contact@ecommerce.com',
    phone: '+91 9876543210',
    address: '123 Business Street, City',
    hours: 'Mon-Fri: 9AM - 6PM'
  });

  const removeBanner = (id: number) => {
    setHeroSliders(heroSliders.filter(banner => banner.id !== id));
  };

  const removeTrend = (id: number) => {
    setTrends(trends.filter(trend => trend.id !== id));
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
            {(['hero', 'about', 'contact', 'trends'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
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
              <Button className="gap-2 bg-primary">
                <Plus className="w-4 h-4" />
                Add Banner
              </Button>
            </div>
            <div className="grid gap-4">
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
                      <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                        <Edit className="w-4 h-4" />
                      </Button>
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
          <div className="space-y-4 max-w-2xl">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                  <input
                    type="text"
                    value={aboutContent.title}
                    onChange={(e) => setAboutContent({...aboutContent, title: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                  <textarea
                    value={aboutContent.description}
                    onChange={(e) => setAboutContent({...aboutContent, description: e.target.value})}
                    rows={6}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Image</label>
                  <div className="flex gap-3">
                    <img 
                      src={aboutContent.image || "/placeholder.svg"}
                      alt="About"
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <Upload className="w-4 h-4" />
                      Change Image
                    </Button>
                  </div>
                </div>
                <Button className="bg-primary">Save Changes</Button>
              </div>
            </Card>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-4 max-w-2xl">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    value={contactContent.email}
                    onChange={(e) => setContactContent({...contactContent, email: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                  <input
                    type="tel"
                    value={contactContent.phone}
                    onChange={(e) => setContactContent({...contactContent, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Address</label>
                  <input
                    type="text"
                    value={contactContent.address}
                    onChange={(e) => setContactContent({...contactContent, address: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Business Hours</label>
                  <input
                    type="text"
                    value={contactContent.hours}
                    onChange={(e) => setContactContent({...contactContent, hours: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button className="bg-primary">Save Changes</Button>
              </div>
            </Card>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Current Trends</h2>
              <Button className="gap-2 bg-primary">
                <Plus className="w-4 h-4" />
                Add Trend
              </Button>
            </div>
            <div className="grid gap-4">
              {trends.map((trend) => (
                <Card key={trend.id} className="p-4">
                  <div className="flex gap-4">
                    <img 
                      src={trend.image || "/placeholder.svg"}
                      alt={trend.title}
                      className="w-32 h-24 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{trend.title}</h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {trend.badge}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{trend.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1 bg-transparent">
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
      </div>
    </AdminLayout>
  );
}

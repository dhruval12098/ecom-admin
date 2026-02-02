# Ecommerce Admin Dashboard - Quick Reference

## 🎯 What Changed

| Feature | Before | After |
|---------|--------|-------|
| **Color** | Blue (#2563EB) | Green (#16A34A) |
| **Domain** | Food Ordering | Ecommerce |
| **Categories** | Simple list | Expandable hierarchy |
| **Content** | Separate pages | Tabbed interface |
| **Shipping** | Basic table | 3-tier system |
| **Products** | 1 image | 5-6 image gallery |
| **Collections** | Exists | Removed |

---

## 📍 Key Pages

### 1. Categories (`/admin/categories`)
```
Click Category → See Subcategories → Click "View Products" → See Products
```

### 2. Content (`/admin/content`)
```
Select Tab:
├── Hero (Banners)
├── About (Text/Image)
├── Contact (Details)
└── Trends (Popular Items)
```

### 3. Shipping (`/admin/shipping`)
```
Choose Type:
├── Free (₹0 above ₹500)
├── Basic (₹50-₹150/zone)
└── Custom (Variable rates)
```

### 4. Products (`/admin/products/add`)
```
Fill Form + Add 6 Images + Select Shipping Type → Save
```

---

## 🎨 Colors at a Glance

| Element | Light | Dark |
|---------|-------|------|
| Primary Button | #16A34A | #22C55E |
| Background | #FFFFFF | #111827 |
| Text | #1F2937 | #F3F4F6 |
| Border | #E5E7EB | #374151 |

---

## 📂 File Locations

```
/app/admin/
├── categories/page.tsx (Expandable cards)
├── content/page.tsx (4 tabs)
├── shipping/page.tsx (3-tier system)
└── products/add/page.tsx (6-image gallery)

/data/
├── categories.json (Full hierarchy)
├── hero-slider.json (4 banners)
└── trends.json (4 trends)

Documentation:
├── ECOMMERCE_UPDATES.md (Technical)
├── FEATURE_GUIDE.md (User guide)
├── COMPLETION_CHECKLIST.md (Requirements)
└── QUICK_REFERENCE.md (This file)
```

---

## ⚡ Quick Tasks

### Add a New Product
1. Go to `/admin/products`
2. Click "Add Product"
3. Fill in details
4. Upload 5-6 images
5. Select primary image
6. Choose shipping type
7. Save

### Create Hero Banner
1. Go to `/admin/content`
2. Click "Hero" tab
3. Click "Add Banner"
4. Fill title & subtitle
5. Upload 2 images (full + mobile)
6. Add button text
7. Save

### Setup Free Shipping
1. Go to `/admin/shipping`
2. Click "Configure" on Free Shipping
3. Set min order value (₹500)
4. Enable shipping
5. Save

### Edit Category
1. Go to `/admin/categories`
2. Click category to expand
3. See subcategories
4. Click "Edit" or "View Products"
5. Make changes
6. Save

---

## 📊 Data Structure Quick Look

### Categories
```json
Category
├── Subcategory 1
│   ├── Product 1 (6 images)
│   └── Product 2 (6 images)
└── Subcategory 2
    └── Product 3 (6 images)
```

### Hero Banners
```json
{
  "title": "Banner Title",
  "imageUrlFullScreen": "1920x600",
  "imageUrlSmallScreen": "480x320",
  "autoplay": "2 seconds"
}
```

### Shipping Types
```
Free Shipping
├── Min order: ₹500
├── Cost: ₹0
└── Status: Enable/Disable

Basic Shipping
├── Zone 1: ₹50
├── Zone 2: ₹75
└── Zone 3: ₹100

Custom Shipping
├── Premium: ₹150
├── Express: ₹200
└── Variable rates
```

---

## 🔍 Sidebar Menu

```
Dashboard
├── Orders
├── Products
├── Categories
├── Inventory
├── Pricing
├── Customers
├── Coupons
├── Payments
├── Content ← NEW (with tabs)
├── Shipping ← UPDATED (3-tier)
├── Reports
├── Activity Logs
└── Settings
```

---

## 💡 Tips

- **Categories:** Limit to 5 max, 3-5 subcategories each
- **Images:** Use consistent sizes for best results
- **Shipping:** Free shipping helps boost sales
- **Banners:** Keep text minimal, 2-3 words max
- **Products:** Set primary image as best seller view

---

## ✅ Verification Checklist

- [ ] Green color visible on buttons/links
- [ ] Categories expandable with click
- [ ] Content page has 4 tabs
- [ ] Shipping shows 3 options
- [ ] Products have 6-image upload
- [ ] Collections removed from menu
- [ ] All pages load without errors
- [ ] Mobile responsive

---

## 🎯 Common Workflows

### Complete Product Setup
```
1. Create Category (e.g., Fruits & Vegetables)
2. Add Subcategory (e.g., Fresh Fruits)
3. Add Product
4. Upload 6 images
5. Set primary image
6. Choose Free/Basic/Custom shipping
7. Set price, discount, tax
8. Save product
```

### Website Content Update
```
1. Go to Content Management
2. Hero Tab: Update banners
3. About Tab: Update description
4. Contact Tab: Update details
5. Trends Tab: Add popular items
6. Save all changes
```

### Shipping Configuration
```
1. Go to Shipping
2. Enable Free Shipping (₹500 min)
3. Configure Basic Zones (4 zones)
4. Setup Custom Premium rates
5. Save all settings
```

---

## 🚨 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Images not showing | Check image URL is valid |
| Green color not visible | Clear browser cache |
| Page not loading | Check `/data/*.json` files exist |
| Tabs not switching | Ensure JavaScript enabled |
| Shipping not saving | Verify all fields filled |

---

## 📈 Success Indicators

✅ Categories showing with images
✅ Can expand/collapse categories
✅ Hero banners rotating every 2 seconds
✅ Content tabs switching smoothly
✅ Shipping options visible and editable
✅ Product image gallery working
✅ All buttons are green
✅ Mobile responsive design

---

## 📞 Quick Help

**Can't find something?**
- Check Documentation: `FEATURE_GUIDE.md`
- Check Technical Details: `ECOMMERCE_UPDATES.md`
- Verify Requirements: `COMPLETION_CHECKLIST.md`

**Data location?**
- Categories: `/data/categories.json`
- Banners: `/data/hero-slider.json`
- Trends: `/data/trends.json`

**Page location?**
- Categories: `/app/admin/categories/page.tsx`
- Content: `/app/admin/content/page.tsx`
- Shipping: `/app/admin/shipping/page.tsx`
- Products: `/app/admin/products/`

---

**Last Updated:** February 2026
**Status:** ✅ Complete and Production Ready

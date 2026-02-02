# Ecommerce Admin Dashboard - Feature Guide

## Overview
Your admin dashboard has been completely transformed from a food ordering system to a professional ecommerce management platform with a green color scheme and dynamic content management.

---

## Feature Breakdown

### 🟢 Color Scheme
**Primary Color:** Green (#16A34A - Light, #22C55E - Dark)
- All buttons, links, and active states use green
- Clean white background
- Professional grayscale for secondary elements

---

## Page-by-Page Guide

### 📁 Categories (COMPLETELY REDESIGNED)
**Location:** `/admin/categories`

**What's New:**
- Expandable category cards
- Click any category to see its subcategories
- Each subcategory shows:
  - Thumbnail image
  - Product count
  - Edit button
  - View Products link

**Hierarchy:**
```
Category Card (Expandable)
├── Subcategory 1
│   └── Contains X Products
├── Subcategory 2
│   └── Contains X Products
└── Subcategory 3
    └── Contains X Products
```

**How to Use:**
1. Click a category card to expand/collapse subcategories
2. Click "View Products" on any subcategory
3. Click "Edit" to modify details
4. Click "Add Category" to create new ones

---

### 📝 Content Management (NEW TAB SYSTEM)
**Location:** `/admin/content`

**4 Dynamic Tabs:**

#### 1️⃣ **Hero Tab**
- Manage website header banners
- 4-5 rotating banners with 2-second autoplay
- Each banner has:
  - Full-screen image variant
  - Small-screen (mobile) image variant
  - Title and subtitle
  - Button text and link
  - Add/Edit/Delete controls

**Example Data:**
```json
{
  "title": "Fresh Organic Fruits",
  "subtitle": "Get 20% off this week",
  "imageUrlFullScreen": "url-1920x600",
  "imageUrlSmallScreen": "url-480x320",
  "buttonText": "Shop Now"
}
```

#### 2️⃣ **About Tab**
- Edit "About Us" page content
- Update company description
- Change about page image
- Dynamic content storage

**Fields:**
- Title (e.g., "About Us")
- Description (Long text)
- Image (Upload or URL)

#### 3️⃣ **Contact Tab**
- Manage contact information
- No external contact form needed
- All contact details in one place

**Fields:**
- Email
- Phone number
- Physical address
- Business hours

#### 4️⃣ **Trends Tab**
- Display current trending products
- Popular items showcase
- Featured collections

**Card Features:**
- Image
- Title
- Description
- Badge (Trending/Popular/Featured)
- Edit/Delete controls

---

### 🚚 Shipping & Delivery (THREE-TIER SYSTEM)
**Location:** `/admin/shipping`

**Three Shipping Options:**

#### 1. FREE SHIPPING
- Activate/deactivate toggle
- Minimum order value setting (₹500 default)
- No delivery charge
- Best for promoting sales

**Settings:**
- ✓ Enable/disable
- ✓ Minimum order amount
- ✓ Automatic application

#### 2. BASIC SHIPPING
- Fixed rates by geographic zone
- Predictable costs for customers
- Zone configuration table

**Example Zones:**
| Zone | Rate | Delivery Time |
|------|------|---------------|
| Central | ₹50 | 2-3 days |
| North | ₹75 | 3-4 days |
| South | ₹75 | 3-4 days |
| Suburbs | ₹100 | 4-5 days |

#### 3. CUSTOM SHIPPING
- Premium and specialized rates
- Product-specific shipping
- Express delivery options

**Example Custom Zones:**
| Zone | Rate | Delivery Time |
|------|------|---------------|
| Express | ₹150 | 1-2 days |
| Premium | ₹200 | Same day |

---

### 📦 Products (ENHANCED)
**Location:** `/admin/products`

**New Image Gallery Feature:**

**Gallery Specifications:**
- 5-6 images maximum
- Grid preview in form
- URL-based image input
- Primary image selector
- Remove image button (X icon)
- Progress counter (X/6 images)

**How to Add Images:**
1. Click "Add Image" button
2. Paste image URL
3. Preview appears in grid
4. Select one as primary (thumbnail)
5. Up to 6 images per product

**Shipping Selection:**
Each product can be set to:
- ✓ Free Shipping
- ✓ Basic Shipping (₹75-150)
- ✓ Custom Rate Shipping

---

## Data Structure

### Categories JSON
```json
{
  "id": 1,
  "name": "Fruits & Vegetables",
  "description": "Fresh organic products",
  "image": "category-image-url",
  "subcategories": [
    {
      "id": 101,
      "name": "Fresh Fruits",
      "image": "subcat-image-url",
      "products": [
        {
          "id": 1001,
          "name": "Organic Apples",
          "price": 120,
          "originalPrice": 150,
          "imageGallery": ["url1", "url2", ...],
          "shipping": {
            "type": "free|basic|custom",
            "cost": 0
          }
        }
      ]
    }
  ]
}
```

### Hero Slider JSON
```json
{
  "id": 1,
  "title": "Fresh Organic Fruits",
  "subtitle": "Get 20% off",
  "imageUrlFullScreen": "url-1920x600",
  "imageUrlSmallScreen": "url-480x320",
  "buttonText": "Shop Now",
  "buttonLink": "/admin/products"
}
```

### Trends JSON
```json
{
  "id": 1,
  "title": "Organic Superfoods",
  "description": "Nutrient-rich foods trending",
  "image": "trend-image-url",
  "badge": "Trending|Popular|Featured"
}
```

---

## Navigation Menu

The sidebar now includes:
- Dashboard
- Orders
- Products
- Categories (expanded card view)
- ~~Collections~~ (removed)
- Inventory
- Pricing
- Customers
- Coupons
- Payments
- Content (NEW - with tabs)
- Shipping (UPDATED - 3-tier system)
- Reports
- Activity Logs
- Settings

---

## Workflow Examples

### Example 1: Adding a New Product Category

1. Go to Categories
2. Click "Add Category"
3. Enter: Fruits & Vegetables
4. Upload category image
5. Click "Add Subcategory"
6. Enter: Fresh Fruits
7. Upload subcategory image
8. Save
9. Now add products under this subcategory

### Example 2: Creating a Hero Banner

1. Go to Content Management
2. Click "Hero" tab
3. Click "Add Banner"
4. Fill in:
   - Title: "Summer Sale"
   - Subtitle: "50% Off All Items"
   - Upload full-screen image (1920x600)
   - Upload mobile image (480x320)
   - Button text: "Shop Now"
5. Save
6. Banner automatically rotates every 2 seconds

### Example 3: Setting Up Free Shipping

1. Go to Shipping & Delivery
2. Click "Configure" on Free Shipping card
3. Set minimum order: ₹500
4. Toggle "Enable Free Shipping" to Yes
5. Click "Save All Settings"
6. Now customers get free shipping for orders ≥ ₹500

### Example 4: Creating Shipping Zones

1. Go to Shipping & Delivery
2. Scroll to "Basic Shipping - Delivery Zones"
3. Click "Edit" on any zone
4. Update:
   - Zone name
   - Shipping cost
   - Estimated days
5. Save
6. Updates immediately

---

## Color Reference

### Green Shades Used
| Use | Color | Hex |
|-----|-------|-----|
| Primary | Green | #16A34A |
| Light | Light Green | #22C55E |
| Dark | Dark Green | #059669 |
| Accent | Darker Green | #14532D |

### Neutral Shades
| Use | Color | Hex |
|-----|-------|-----|
| Background | White | #FFFFFF |
| Text | Dark Gray | #1F2937 |
| Borders | Light Gray | #E5E7EB |
| Muted | Very Light | #F9FAFB |

---

## Tips & Best Practices

### Categories
- ✓ Use clear, descriptive names
- ✓ Upload high-quality category images (500x500px recommended)
- ✓ Organize logically (Fruits & Vegetables, Dairy & Bakery, etc.)
- ✓ Limit to 3-5 subcategories per category

### Hero Banners
- ✓ Use 1920x600px for full-screen images
- ✓ Use 480x320px for mobile images
- ✓ Keep text minimal and readable
- ✓ 2-second autoplay is optimal for 3-4 banners

### Products
- ✓ Add 5-6 images from different angles
- ✓ Set best-selling angle as primary image
- ✓ Use consistent shipping type within category
- ✓ Keep descriptions concise

### Shipping
- ✓ Use free shipping for orders > ₹500
- ✓ Basic shipping for most deliveries
- ✓ Custom rates for premium/express options
- ✓ Set realistic delivery times

---

## Frequently Asked Questions

**Q: Can I have more than 6 product images?**
A: Current limit is 6. This can be increased with database modification.

**Q: How many hero banners can I add?**
A: Currently 4-5. More can be added by modifying the data file.

**Q: Can products have different shipping in a category?**
A: Yes! Each product individually selects its shipping type.

**Q: How do I change banner rotation time?**
A: Currently set to 2 seconds. Contact development for customization.

**Q: Can I schedule promotional banners?**
A: Hero banners display currently without scheduling. Can be added in future.

---

**Your ecommerce admin dashboard is ready to use! Start managing your products, content, and shipping today.** 🎉

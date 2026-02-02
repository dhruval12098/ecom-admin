# Category Management Structure - Complete Guide

## Hierarchy Overview

```
Category (Name Only - NO IMAGE)
└── SubCategory (HAS IMAGE)
    └── Product (Multiple Images 5-6)
```

---

## Page Navigation Flow

### 1. Categories Page (`/admin/categories`)
- **What you see:** List of category names
- **No images** for categories
- **Click action:** Navigate to that category's subcategories

Example:
```
Fruits & Vegetables → Click → Go to subcategories page
Dairy & Bakery → Click → Go to subcategories page
```

---

### 2. Subcategories Page (`/admin/categories/[categoryId]`)
- **What you see:** Grid of subcategory CARDS
- **Each card shows:**
  - Subcategory IMAGE (display image)
  - Subcategory NAME
  - Product count
  - "View Products" button
  - "Edit" button
  - "Add Product" button

Example:
```
Category: Fruits & Vegetables
├── Fresh Fruits (with image)
│   └── 2 Products
├── Organic Vegetables (with image)
│   └── 1 Product
└── Dry Fruits (with image)
    └── 3 Products
```

---

### 3. Products Page (`/admin/categories/[categoryId]/[subcategoryId]`)
- **What you see:** Grid of PRODUCT CARDS
- **Each product card shows:**
  - Primary image from gallery (first image)
  - Product NAME
  - Price & discount
  - Stock status
  - Rating
  - Edit & Delete buttons

---

## JSON Structure

### Categories.json
```json
[
  {
    "id": 1,
    "name": "Fruits & Vegetables",
    "slug": "fruits-vegetables",
    "subcategories": [
      {
        "id": 101,
        "name": "Fresh Fruits",
        "slug": "fresh-fruits",
        "image": "URL",  // ← Subcategory IMAGE
        "productCount": 2,
        "products": [
          {
            "id": 1001,
            "name": "Organic Apples",
            "price": 120,
            "imageGallery": [
              "image1.jpg",  // ← Multiple product images
              "image2.jpg",
              "image3.jpg",
              "image4.jpg",
              "image5.jpg",
              "image6.jpg"
            ]
          }
        ]
      }
    ]
  }
]
```

**Key Points:**
- ❌ NO `image` field on Category
- ✅ `image` field on SubCategory (display image)
- ✅ `imageGallery` array on Product (5-6 images)

---

## File Structure

```
/app/admin/categories/
├── page.tsx                                    # List of categories (names only)
├── add/page.tsx                               # Add new category
├── edit/[id]/page.tsx                         # Edit category
├── [categoryId]/
│   ├── page.tsx                               # List subcategories with cards
│   ├── [subcategoryId]/
│   │   ├── page.tsx                           # List products with cards
│   │   ├── add-product/page.tsx               # Add product form
│   │   └── edit/[productId]/page.tsx          # Edit product form
│   └── edit/
│       └── [id]/page.tsx                      # Edit subcategory
```

---

## URL Examples

| Page | URL |
|------|-----|
| All Categories | `/admin/categories` |
| Fruits & Vegetables subcats | `/admin/categories/1` |
| Fresh Fruits products | `/admin/categories/1/101` |
| Add product to Fresh Fruits | `/admin/categories/1/101/add-product` |
| Edit product | `/admin/categories/1/101/edit/1001` |

---

## Display Images Explained

**Category:** No image (just a name)
- Used only for navigation/organization

**SubCategory:** Has ONE display image
- Shows on subcategory card
- Used as thumbnail/preview
- Represents the whole subcategory

**Product:** Has 5-6 images
- Multiple angles/variants
- First image is primary/thumbnail
- User can view all in gallery

---

## What Changed

✅ **Removed** image field from Category in JSON  
✅ **Kept** image field in SubCategory  
✅ **Updated** categories page to show names only  
✅ **Created** subcategory detail page with card grid  
✅ **Created** products page with product cards  
✅ **Made** category names clickable to navigate  

---

## Admin Features

### Categories Page
- View all category names
- Click to see subcategories
- Add new category button

### Subcategories Page
- View all subcategories for a category
- See subcategory images
- See product count
- Quick "View Products" access
- Edit subcategory
- Add new product

### Products Page
- View all products in a subcategory
- See product images, prices, stock
- Edit product
- Delete product
- Add new product to subcategory

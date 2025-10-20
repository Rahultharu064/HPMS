# 🏨 Public Website Rooms Page - Backend Integration

## 📋 **Overview**

The public website Rooms page has been fully updated to fetch real data from the backend API instead of using static data. This provides dynamic, searchable, and filterable room listings with pagination.

## 🔧 **Backend Integration**

### **API Endpoints Used**
- **`GET /api/rooms`** - Fetch all rooms with search, filters, and pagination
- **Parameters**: `page`, `limit`, `search`, `roomType`, `minPrice`, `maxPrice`, `status`

### **Service Integration**
```javascript
// Frontend service call
const response = await roomService.getRooms(page, limit, queryParams)
```

## 🎨 **Frontend Features**

### **1. Dynamic Data Fetching**
- ✅ **Real-time API calls** to fetch room data
- ✅ **Loading states** with spinner and message
- ✅ **Error handling** with fallback to static data
- ✅ **Pagination support** with page navigation

```javascript
// State management
const [rooms, setRooms] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
const [pagination, setPagination] = useState({
  currentPage: 1,
  totalPages: 1,
  total: 0
})
```

### **2. Advanced Filtering**
- ✅ **Search functionality** - Search by room name, type, description
- ✅ **Room type filter** - Filter by Room, Suite, or All Types
- ✅ **Price range filtering** - Min/max price filters
- ✅ **Status filtering** - Available rooms only

```javascript
// Filter state
const [filters, setFilters] = useState({
  search: '',
  roomType: 'all',
  minPrice: '',
  maxPrice: '',
  status: 'available'
})
```

### **3. Sorting Options**
- ✅ **Price sorting** - Low to High, High to Low
- ✅ **Name sorting** - Alphabetical order
- ✅ **Date sorting** - Newest first
- ✅ **Real-time updates** - Sorts immediately when changed

### **4. View Modes**
- ✅ **Grid view** - Card-based layout (default)
- ✅ **List view** - Horizontal card layout
- ✅ **Responsive design** - Adapts to screen size
- ✅ **Smooth transitions** - Between view modes

### **5. Room Data Processing**
- ✅ **Image handling** - Supports both external URLs and local uploads
- ✅ **Amenity mapping** - Converts backend amenity objects to display names
- ✅ **Fallback data** - Shows sample rooms if API fails
- ✅ **Data validation** - Handles missing or malformed data

```javascript
// Helper functions
const getRoomImage = (room) => {
  if (room.image && room.image.length > 0) {
    return room.image[0].url.startsWith('http') 
      ? room.image[0].url 
      : `http://localhost:5000/${room.image[0].url}`
  }
  return 'fallback-image-url'
}

const getRoomAmenities = (room) => {
  if (room.amenity && room.amenity.length > 0) {
    return room.amenity.map(a => a.name)
  }
  return ['Free WiFi', 'Parking', 'Breakfast']
}
```

## 🚀 **Key Features**

### **Search & Filter System**
- **Real-time search** - Updates results as you type
- **Multiple filters** - Room type, price range, status
- **Filter persistence** - Maintains filters across page changes
- **Clear indicators** - Shows active filters and result counts

### **Pagination System**
- **Page navigation** - Previous/Next buttons
- **Page indicators** - Shows current page and total pages
- **Disabled states** - Proper button states for first/last pages
- **Smooth loading** - Maintains scroll position during page changes

### **Responsive Design**
- **Mobile-first** - Optimized for all screen sizes
- **Touch-friendly** - Large buttons and touch targets
- **Adaptive layout** - Grid adjusts based on screen size
- **Performance optimized** - Efficient rendering and state management

### **Error Handling**
- **Graceful degradation** - Falls back to static data if API fails
- **User feedback** - Clear error messages and loading states
- **Retry mechanism** - Users can refresh to retry failed requests
- **Console logging** - Detailed error information for debugging

## 🔄 **Data Flow**

1. **Component Mount** → Fetch rooms with default filters
2. **Filter Change** → Trigger new API call with updated filters
3. **Search Input** → Debounced search with real-time results
4. **Page Change** → Fetch new page of results
5. **Sort Change** → Re-fetch with new sorting
6. **Error Handling** → Show fallback data and error message

## 🧪 **Testing**

### **Backend Testing**
```bash
# Test rooms endpoint with filters
curl "http://localhost:5000/api/rooms?page=1&limit=12&search=suite&roomType=Suite"
```

### **Frontend Testing**
1. **Start servers**:
   ```bash
   cd backend && npm run dev
   cd frontend && npm run dev
   ```

2. **Test functionality**:
   - Visit `http://localhost:5173/rooms`
   - Test search functionality
   - Test room type filtering
   - Test pagination
   - Test view mode switching

3. **Test error handling**:
   - Stop backend server
   - Refresh page
   - Verify fallback data shows

## 📱 **Mobile Experience**

- **Touch gestures** - Swipe-friendly interface
- **Responsive grid** - Adapts to screen size
- **Touch targets** - Large enough buttons for mobile
- **Performance** - Optimized for mobile devices

## 🎯 **Performance Optimizations**

- **Efficient state management** - Minimal re-renders
- **Debounced search** - Reduces API calls
- **Image optimization** - Proper image handling and fallbacks
- **Lazy loading** - Images load as needed
- **Error boundaries** - Graceful error handling

## 🔧 **Configuration**

### **Default Settings**
- **Page size**: 12 rooms per page
- **Default filters**: All available rooms
- **Default sort**: Price low to high
- **Default view**: Grid mode

### **API Configuration**
- **Base URL**: `http://localhost:5000`
- **Timeout**: Handled by service layer
- **Retry logic**: Built into API service
- **Error handling**: Centralized in service layer

## 📊 **Data Structure**

### **Backend Response**
```javascript
{
  success: true,
  currentPage: 1,
  totalPages: 3,
  total: 25,
  data: [
    {
      id: 1,
      name: "Deluxe Suite",
      roomType: "Suite",
      price: 8500,
      maxAdults: 2,
      size: 45,
      description: "Spacious suite...",
      amenity: [{ name: "Free WiFi" }, { name: "Parking" }],
      image: [{ url: "uploads/images/room1.jpg" }],
      video: []
    }
  ]
}
```

### **Frontend Processing**
- **Image URLs** - Converted to full URLs
- **Amenities** - Mapped to display names
- **Pagination** - Extracted to separate state
- **Error handling** - Wrapped in try-catch blocks

## 🎨 **UI/UX Features**

- **Loading animations** - Smooth spinner with message
- **Hover effects** - Card animations and transitions
- **Visual feedback** - Clear button states and interactions
- **Accessibility** - Proper ARIA labels and keyboard navigation
- **Consistent styling** - Matches design system

The Rooms page is now fully integrated with the backend and provides a dynamic, searchable, and filterable room listing experience! 🎉

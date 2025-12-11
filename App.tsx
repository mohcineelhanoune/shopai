
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider, useCart } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { PRODUCTS as MOCK_PRODUCTS, INITIAL_CATEGORIES as MOCK_CATEGORIES, INITIAL_MENU_ITEMS } from './services/mockData';
import { 
  fetchProductsFromDB, addProductToDB, updateProductInDB, deleteProductFromDB,
  fetchCategoriesFromDB, addCategoryToDB,
  fetchBannersFromDB, addBannerToDB, updateBannerInDB, deleteBannerFromDB,
  fetchMenuItemsFromDB, upsertMenuItemToDB, deleteMenuItemFromDB
} from './services/db';
import { ViewState, Product, Category, BannerSlide, MenuItem, CartItem } from './types';
import { useAuth } from './contexts/AuthContext';
import { ArrowLeftRight, X, Shield, Loader2 } from 'lucide-react';

// Components organized by folder
import Navbar from './components/frontend/Navbar';
import CartDrawer from './components/frontend/CartDrawer';
import WishlistView from './components/frontend/WishlistView';
import ProductDetails from './components/frontend/ProductDetails';
import BannerSlider from './components/frontend/BannerSlider';
import PromotionalSection from './components/frontend/PromotionalSection';
import FloatingNotification from './components/frontend/FloatingNotification';
import ComparisonModal from './components/frontend/ComparisonModal';
import CategoryShowcase from './components/frontend/CategoryShowcase';
import ContactView from './components/frontend/ContactView';
import ClientDashboard from './components/frontend/ClientDashboard';
import ShippingReturns from './components/frontend/ShippingReturns';
import FAQ from './components/frontend/FAQ';
import ShopView from './components/frontend/ShopView'; 
import ParallaxBanner from './components/frontend/ParallaxBanner'; 
import ExpressCheckoutModal from './components/frontend/ExpressCheckoutModal';

import AdminDashboard from './components/backend/AdminDashboard';
import AuthForm from './components/common/AuthForms';

const INITIAL_SLIDES: BannerSlide[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
    title: "New Season Arrivals",
    subtitle: "Discover the latest fashion trends designed to elevate your style.",
    cta: "Shop Collection",
    align: "left"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop",
    title: "Premium Audio Gear",
    subtitle: "Immerse yourself in crystal clear sound with our latest headphones.",
    cta: "Explore Audio",
    align: "right"
  }
];

// Wrapper component to consume contexts for navigation logic
const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const { user } = useAuth();
  const { t } = useLanguage();
  const { items: cartItems } = useCart();
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Search State
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter & Sort State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');

  // Selected Product for Details View
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Comparison State
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);

  // Function to load all initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
        // Parallel fetch
        const [fetchedProducts, fetchedCategories, fetchedBanners, fetchedMenu] = await Promise.all([
            fetchProductsFromDB(),
            fetchCategoriesFromDB(),
            fetchBannersFromDB(),
            fetchMenuItemsFromDB()
        ]);

        // Products Fallback
        if (fetchedProducts.length === 0) {
            console.log("Database empty. Seeding mock products...");
            setProducts(MOCK_PRODUCTS);
            MOCK_PRODUCTS.forEach(p => addProductToDB(p)); // Seed DB
        } else {
            setProducts(fetchedProducts);
        }

        // Categories Fallback
        if (fetchedCategories.length === 0) {
             setCategories(MOCK_CATEGORIES);
             MOCK_CATEGORIES.forEach(c => addCategoryToDB(c));
        } else {
             setCategories(fetchedCategories);
        }

        // Banners Fallback
        if (fetchedBanners.length === 0) {
             setSlides(INITIAL_SLIDES);
             INITIAL_SLIDES.forEach(b => addBannerToDB(b));
        } else {
             setSlides(fetchedBanners);
        }

        // Menu Fallback
        if (fetchedMenu.length === 0) {
             setMenuItems(INITIAL_MENU_ITEMS);
             INITIAL_MENU_ITEMS.forEach(m => upsertMenuItemToDB(m));
        } else {
             setMenuItems(fetchedMenu);
        }

        setHasMore(false); // DB fetch returns all for now
    } catch (error) {
        console.error("Error initializing data:", error);
        // Fallback to mocks just in case
        setProducts(MOCK_PRODUCTS);
        setCategories(MOCK_CATEGORIES);
        setSlides(INITIAL_SLIDES);
        setMenuItems(INITIAL_MENU_ITEMS);
    } finally {
        setLoading(false);
    }
  }, []);

  // Initial Fetch
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    setSelectedCategory('All'); 
    setLoading(true); 
    setCurrentView('SHOP');
    window.scrollTo(0, 0);
    // Simple client side filter since we load all products
    setLoading(false);
  };

  const handleLoadMore = () => {
    // Logic disabled as we fetch all from DB currently
  };

  // --- CRUD Handlers ---

  const handleAddProduct = async (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);
    await addProductToDB(newProduct);
    await loadData(); // Refresh IDs
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    await updateProductInDB(updatedProduct);
  };

  const handleDeleteProduct = async (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    await deleteProductFromDB(id);
  };

  const handleAddCategory = async (newCategory: Category) => {
    setCategories(prev => [...prev, newCategory]);
    await addCategoryToDB(newCategory);
    // Refresh to get ID
    const cats = await fetchCategoriesFromDB();
    setCategories(cats);
  };

  const handleAddBanner = async (newBanner: BannerSlide) => {
    setSlides(prev => [...prev, newBanner]);
    await addBannerToDB(newBanner);
    const banners = await fetchBannersFromDB();
    setSlides(banners);
  };

  const handleUpdateBanner = async (updatedBanner: BannerSlide) => {
    setSlides(prev => prev.map(b => b.id === updatedBanner.id ? updatedBanner : b));
    await updateBannerInDB(updatedBanner);
  };

  const handleDeleteBanner = async (id: number) => {
    setSlides(prev => prev.filter(s => s.id !== id));
    await deleteBannerFromDB(id);
  };

  const handleUpdateMenu = async (items: MenuItem[]) => {
    // Optimistic
    setMenuItems(items);
    // Persist each item (simplified upsert logic)
    for (const item of items) {
        await upsertMenuItemToDB(item);
    }
    const menu = await fetchMenuItemsFromDB();
    setMenuItems(menu);
  };

  const handleDeleteMenuItem = async (id: string) => {
      setMenuItems(prev => prev.filter(item => item.id !== id));
      await deleteMenuItemFromDB(id);
  };

  // Filter and sort products for display
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        result = result.filter(p => p.title.toLowerCase().includes(lower) || p.category.toLowerCase().includes(lower));
    }

    if (selectedCategory === 'On Sale') {
        result = result.filter(p => p.originalPrice && p.originalPrice > p.price);
    } else if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating.rate - a.rating.rate);
        break;
      default:
        break;
    }

    return result;
  }, [products, selectedCategory, sortBy, searchTerm]);

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      setCheckoutItems(cartItems);
      setIsCheckoutOpen(true);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('PRODUCT_DETAILS');
  };

  const toggleCompare = (product: Product) => {
    setCompareList(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      if (prev.length >= 4) {
        alert("You can compare up to 4 products at a time.");
        return prev;
      }
      return [...prev, product];
    });
  };

  const removeFromCompare = (productId: number) => {
    setCompareList(prev => prev.filter(p => p.id !== productId));
  };
  
  const isCompared = (productId: number) => compareList.some(p => p.id === productId);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentView('SHOP');
  };

  const renderView = () => {
    if (loading && products.length === 0 && currentView === 'HOME') {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 text-amber-600 animate-spin mb-4" />
                <p className="text-gray-500">Loading store data...</p>
            </div>
        );
    }

    switch (currentView) {
      case 'LOGIN':
        return (
          <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <AuthForm 
              type="LOGIN" 
              onSuccess={() => setCurrentView('HOME')} 
              onSwitchMode={setCurrentView} 
            />
          </div>
        );
      case 'SIGNUP':
        return (
          <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <AuthForm 
              type="SIGNUP" 
              onSuccess={() => setCurrentView('HOME')} 
              onSwitchMode={setCurrentView} 
            />
          </div>
        );
      case 'WISHLIST':
        return (
          <WishlistView 
            onNavigateHome={() => setCurrentView('SHOP')}
            onProductClick={handleProductClick}
          />
        );
      case 'CONTACT':
        return <ContactView />;
      case 'DASHBOARD':
        return <ClientDashboard onNavigate={setCurrentView} />;
      case 'SHIPPING':
        return <ShippingReturns />;
      case 'FAQ':
        return <FAQ />;
      case 'ADMIN_DASHBOARD':
        return (
          <AdminDashboard 
            products={products}
            categories={categories}
            banners={slides}
            menuItems={menuItems}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddCategory={handleAddCategory}
            onAddBanner={handleAddBanner}
            onUpdateBanner={handleUpdateBanner}
            onDeleteBanner={handleDeleteBanner}
            onUpdateMenu={handleUpdateMenu}
            onDeleteMenuItem={handleDeleteMenuItem}
            onNavigate={setCurrentView}
          />
        );
      case 'PRODUCT_DETAILS':
        return selectedProduct ? (
          <ProductDetails 
            product={selectedProduct} 
            relatedProducts={products}
            onBack={() => setCurrentView('SHOP')}
            onProductClick={handleProductClick}
            isCompared={compareList.some(p => p.id === selectedProduct.id)}
            onToggleCompare={toggleCompare}
          />
        ) : (
          <div className="p-8 text-center">Product not found</div>
        );
      case 'SHOP':
        return (
          <ShopView 
            products={filteredProducts}
            categories={categories}
            selectedCategory={selectedCategory}
            sortBy={sortBy}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onSelectCategory={setSelectedCategory}
            onSortChange={setSortBy}
            onProductClick={handleProductClick}
            isCompared={isCompared}
            onToggleCompare={toggleCompare}
            onLoadMore={handleLoadMore}
          />
        );
      case 'HOME':
      default:
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
            <BannerSlider slides={slides} />
            <PromotionalSection 
              products={products} 
              onProductClick={handleProductClick}
              onViewAll={() => {
                  setSelectedCategory('On Sale');
                  setCurrentView('SHOP');
                  window.scrollTo(0, 0);
              }}
            />
            <ParallaxBanner 
              image="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
              title="Premium Quality, Unmatched Style"
              subtitle="Experience the difference with our handpicked selection of premium goods designed for the modern lifestyle."
              cta="Explore Collection"
              onCtaClick={() => setCurrentView('SHOP')}
            />
            {categories.slice(0, 4).map((category) => {
                const hasProducts = products.some(p => p.category === category.name);
                if (!hasProducts) return null;
                return (
                    <CategoryShowcase 
                        key={category.id}
                        title={category.name}
                        subtitle={`Explore our collection of ${category.name}`}
                        category={category.name}
                        products={products}
                        onProductClick={handleProductClick}
                        isCompared={isCompared}
                        onToggleCompare={toggleCompare}
                    />
                );
            })}
            <FloatingNotification 
                products={products} 
                onProductClick={handleProductClick} 
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
      {currentView !== 'ADMIN_DASHBOARD' && (
        <Navbar 
          currentView={currentView} 
          onNavigate={setCurrentView}
          onCategorySelect={handleCategorySelect}
          onSearch={handleSearch}
          menuItems={menuItems}
          categories={categories}
        />
      )}
      <main className="flex-grow">
        {renderView()}
      </main>
      
      {/* Checkout Modal for Cart */}
      <ExpressCheckoutModal 
        items={checkoutItems}
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
      />

      {/* Compare Bar & Modal logic remains same... */}
      {compareList.length > 0 && currentView !== 'ADMIN_DASHBOARD' && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-2xl p-2 pl-6 flex items-center gap-4 border border-gray-700 dark:border-gray-200">
            <span className="font-medium text-sm whitespace-nowrap">
              {compareList.length} Selected
            </span>
            <div className="flex -space-x-2">
              {compareList.map(p => (
                <div key={p.id} className="w-8 h-8 rounded-full border-2 border-gray-900 dark:border-white overflow-hidden bg-white">
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pl-2">
              <button onClick={() => setCompareList([])} className="p-2 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-white dark:text-gray-500 dark:hover:text-gray-900">
                <X className="h-4 w-4" />
              </button>
              <button onClick={() => setIsCompareModalOpen(true)} className="bg-amber-600 hover:bg-amber-50 dark:bg-amber-500 dark:hover:bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-900/20">
                <ArrowLeftRight className="h-4 w-4" /> Compare
              </button>
            </div>
          </div>
        </div>
      )}
      {currentView !== 'ADMIN_DASHBOARD' && <CartDrawer onCheckoutRequest={handleCheckout} />}
      <ComparisonModal products={compareList} isOpen={isCompareModalOpen} onClose={() => setIsCompareModalOpen(false)} onRemove={removeFromCompare} />
      {currentView !== 'ADMIN_DASHBOARD' && (
        <>
          <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 py-12 mt-16 transition-colors duration-300">
              <div className="max-w-7xl mx-auto px-4 text-center">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">Ma lumière : 34 rue Boulmane , Bourgogne Casablanca</h3>
                  <p className="text-lg md:text-xl text-amber-600 dark:text-amber-500 font-bold">Tel : 0663195596 - Whatsap : 0700141404</p>
              </div>
          </div>
          <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
            {/* Footer Content */}
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                  {/* ... Footer cols ... */}
                  <div className="col-span-1 md:col-span-1">
                     <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 mb-4">Lumina</h3>
                     <p className="text-gray-500 dark:text-gray-400 text-sm">{t('premiumProducts')}</p>
                  </div>
                  {/* ... Other footer cols ... */}
               </div>
              <div className="border-t border-gray-100 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-center text-gray-400 dark:text-gray-500 text-sm">© {new Date().getFullYear()} Lumina Market. {t('rightsReserved')}</p>
                <div className="flex gap-4">
                   <button onClick={() => setCurrentView('ADMIN_DASHBOARD')} className="flex items-center gap-1 text-xs text-gray-400 hover:text-amber-600 transition-colors">
                     <Shield className="h-3 w-3" /> {t('adminAccess')}
                   </button>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <WishlistProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </WishlistProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;

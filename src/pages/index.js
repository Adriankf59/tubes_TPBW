import Head from "next/head";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

// SVG Icon Components
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const MountainIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20h16L14 8l-3 5-3-5-4 12z" />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg className="w-4 h-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const BookmarkIcon = ({ filled }) => (
  <svg className="w-4 h-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ElevationIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

// Image URL helper functions
const buildImageUrlViaProxy = (imageId) => {
  if (!imageId) return null;
  const originalUrl = `https://adrianfirmansyah-website.my.id/trailview/assets/${imageId}`;
  // Use a more reliable proxy service
  return `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&w=400&h=300&fit=cover&output=webp&q=80`;
};

const buildDirectImageUrl = (imageId) => {
  if (!imageId) return null;
  return `https://adrianfirmansyah-website.my.id/trailview/assets/${imageId}`;
};

const buildImageUrl = (imageId) => {
  // Try direct URL first, then fallback to proxy
  return buildDirectImageUrl(imageId) || buildImageUrlViaProxy(imageId);
};

// SVG placeholder as base64
const svgPlaceholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMjAwTDE1MCA5MEwyMDAgMTYwTDI1MCA4MEwzMDAgMjAwSDEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPGV0bGlwc2UgY3g9IjMwMCIgY3k9IjkwIiByeD0iMjAiIHJ5PSIyMCIgZmlsbD0iI0ZCQkYyNCIvPgo8dGV4dCB4PSIyMDAiIHk9IjE4MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkd1bnVuZyBJbmRvbmVzaWE8L3RleHQ+Cjwvc3ZnPg==";

// Trail Card Component with fixes
const TrailCard = ({ mountain, index, availableMountains = [] }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const [isClient, setIsClient] = useState(false);
  
  // Fix hydration by ensuring client-side only rendering for dynamic content
  useEffect(() => {
    setIsClient(true);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 100);
    
    return () => clearTimeout(timer);
  }, [index]);
  
  useEffect(() => {
    if (isClient) {
      // Set initial image source only on client side
      if (mountain?.image) {
        // Try direct URL first
        setImageSrc(buildDirectImageUrl(mountain.image));
      } else {
        setImageSrc(getFallbackImageUrl());
      }
    }
  }, [mountain, availableMountains, isClient]);
  
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'moderate': 
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getDifficultyText = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'Mudah';
      case 'moderate': 
      case 'medium': return 'Sedang';
      case 'hard': return 'Sulit';
      default: return difficulty || 'Tidak diketahui';
    }
  };
  
  const getFallbackImageUrl = () => {
    if (!availableMountains || availableMountains.length === 0) {
      return svgPlaceholder;
    }
    
    const mountainsWithImages = availableMountains.filter(m => 
      m?.image && m?.id !== mountain?.id
    );
    
    if (mountainsWithImages.length > 0) {
      const fallbackIndex = (mountain?.id || 0) % mountainsWithImages.length;
      const fallbackImage = mountainsWithImages[fallbackIndex]?.image;
      return fallbackImage ? buildDirectImageUrl(fallbackImage) : svgPlaceholder;
    }
    
    return svgPlaceholder;
  };
  
  const handleImageError = () => {
    if (isClient) {
      console.error('Image failed to load:', imageSrc);
      
      // Try different strategies in sequence
      if (imageSrc && imageSrc.includes('adrianfirmansyah-website.my.id') && !imageSrc.includes('weserv.nl')) {
        // If direct URL failed, try proxy
        console.log('Direct URL failed, trying proxy...');
        const proxyUrl = buildImageUrlViaProxy(mountain.image);
        if (proxyUrl) {
          setImageSrc(proxyUrl);
          return;
        }
      }
      
      // If everything failed, use fallback
      setImageSrc(getFallbackImageUrl());
    }
  };
  
  // Don't render until client-side
  if (!isClient) {
    return (
      <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm h-80 animate-pulse">
        <div className="h-48 bg-gray-200"></div>
        <div className="p-5">
          <div className="h-4 bg-gray-200 rounded mb-3"></div>
          <div className="h-3 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  // Ensure mountain data exists
  if (!mountain) {
    return null;
  }
  
  // Handle card click navigation
  const handleCardClick = (e) => {
    // Don't navigate if clicking the bookmark button
    if (e.target.closest('button')) {
      return;
    }
    
    // Navigate to mountain detail page
    if (mountain?.id) {
      window.location.href = `/mountains/${mountain.id}`;
    }
  };
  
  return (
    <div 
      onClick={handleCardClick}
      className={`group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(e);
        }
      }}
      aria-label={`Lihat detail pendakian Gunung ${mountain?.name || 'Unknown'}`}
    >
      <div className="relative h-48 overflow-hidden">
        <Image
          src={imageSrc || svgPlaceholder} 
          alt={`Jalur pendakian Gunung ${mountain.name || 'Unknown'} di ${mountain.kota || 'Unknown'}, ${mountain.provinsi || 'Unknown'}`}
          width={400}
          height={300}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          priority={index < 4}
          placeholder="blur"
          blurDataURL={svgPlaceholder}
          onError={handleImageError}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized={true} // Disable Next.js optimization for external images
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsSaved(!isSaved);
          }}
          className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
          aria-label={`Simpan ${mountain.name || 'gunung ini'}`}
        >
          <BookmarkIcon filled={isSaved} />
        </button>
      </div>
      
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-300">
            Gunung {mountain.name || 'Unknown'}
          </h3>
          {mountain.difficulty && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getDifficultyColor(mountain.difficulty)} transform group-hover:scale-105 transition-transform duration-300`}>
              {getDifficultyText(mountain.difficulty)}
            </span>
          )}
        </div>
        
        <div className="flex items-center text-sm text-gray-600 mb-3 group-hover:text-gray-700 transition-colors duration-300">
          <MapPinIcon />
          <span className="ml-1">{mountain.kota || 'Unknown'}, {mountain.provinsi || 'Unknown'}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
            <ElevationIcon />
            <span className="ml-1">Ketinggian: {mountain.elevation || 'Unknown'}m</span>
          </div>
          {mountain.rating && (
            <div className="flex items-center transform group-hover:scale-110 transition-transform duration-300">
              <StarIcon filled={true} />
              <span className="ml-1 font-medium">{mountain.rating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Home({ mountains = [], totalCount = 0, error }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("All");
  const [filteredMountains, setFilteredMountains] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const searchRef = useRef(null);
  
  const itemsPerPage = 4;
  
  // Fix hydration by ensuring client-side only rendering
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!isClient) return;
    
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isClient]);
  
  // Ensure mountains is always an array
  const safeMountains = Array.isArray(mountains) ? mountains : [];
  const uniqueProvinces = ["All", ...new Set(safeMountains.map(m => m?.provinsi).filter(Boolean))].sort();
  
  const provinceCounts = safeMountains.reduce((acc, mountain) => {
    const province = mountain?.provinsi;
    if (province) {
      acc[province] = (acc[province] || 0) + 1;
    }
    return acc;
  }, {});
  
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value && isClient) {
      const filtered = safeMountains.filter(mountain =>
        mountain?.name?.toLowerCase().includes(value.toLowerCase()) ||
        mountain?.kota?.toLowerCase().includes(value.toLowerCase()) ||
        mountain?.provinsi?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredMountains(filtered);
      setShowDropdown(true);
    } else {
      setFilteredMountains([]);
      setShowDropdown(false);
    }
  };
  
  const getCurrentMountains = () => {
    let currentMountains = safeMountains;
    
    if (selectedProvince !== "All") {
      currentMountains = currentMountains.filter(m => m?.provinsi === selectedProvince);
    }
    
    return currentMountains;
  };
  
  const displayedMountains = getCurrentMountains();
  const totalPages = Math.ceil(displayedMountains.length / itemsPerPage);
  const currentMountains = displayedMountains.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );
  
  return (
    <>
      <Head>
        <title>TrailView ID - Jalur Pendakian Gunung Indonesia | Info Lengkap Gunung Nusantara</title>
        <meta name="description" content="Temukan informasi lengkap jalur pendakian gunung di Indonesia. Database terlengkap gunung-gunung Indonesia dengan info ketinggian, tingkat kesulitan, rute pendakian, dan tips pendakian untuk para pendaki pemula hingga profesional." />
        <meta name="keywords" content="jalur pendakian gunung indonesia, gunung indonesia, hiking indonesia, trekking indonesia, pendakian gunung, info gunung indonesia, rute pendakian, gunung jawa barat, gunung jawa timur, gunung jawa tengah, gunung sumatra, gunung bali, gunung lombok, basecamp pendakian, tips mendaki gunung" />
        <meta name="author" content="TrailView ID" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="TrailView ID - Jalur Pendakian Gunung Indonesia" />
        <meta property="og:description" content="Database terlengkap jalur pendakian gunung di Indonesia. Temukan info ketinggian, tingkat kesulitan, dan rute pendakian gunung favorit Anda." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://trailview.id" />
        <meta property="og:image" content="https://trailview.id/images/og-image.jpg" />
        <meta property="og:locale" content="id_ID" />
        <meta property="og:site_name" content="TrailView ID" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TrailView ID - Jalur Pendakian Gunung Indonesia" />
        <meta name="twitter:description" content="Database terlengkap jalur pendakian gunung di Indonesia dengan info lengkap untuk pendaki." />
        <meta name="twitter:image" content="https://trailview.id/images/twitter-card.jpg" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://trailview.id" />
        
        {/* Hreflang for Indonesian */}
        <link rel="alternate" hrefLang="id" href="https://trailview.id" />
        <link rel="alternate" hrefLang="x-default" href="https://trailview.id" />
        
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "TrailView ID",
              "description": "Platform informasi jalur pendakian gunung terlengkap di Indonesia",
              "url": "https://trailview.id",
              "logo": "https://trailview.id/logo.png",
              "sameAs": [
                "https://www.facebook.com/trailviewid",
                "https://www.instagram.com/trailviewid",
                "https://twitter.com/trailviewid"
              ]
            })
          }}
        />
        
        {/* Structured Data - WebSite with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "TrailView ID",
              "url": "https://trailview.id",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://trailview.id/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        
        {/* Structured Data - BreadcrumbList */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [{
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://trailview.id"
              }]
            })
          }}
        />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Static Header */}
        <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold flex items-center text-white drop-shadow-lg">
                  <MountainIcon />
                  <span className="ml-2">TrailView ID</span>
                </h1>
              </div>
              
              <nav className="hidden md:flex items-center space-x-8">
                {['Explore', 'Saved', 'Maps', 'Community'].map((item) => (
                  <button 
                    key={item}
                    className="font-medium flex items-center transition-all duration-300 hover:scale-105 text-white hover:text-green-300 drop-shadow-lg"
                  >
                    {item}
                    {(item === 'Explore' || item === 'Saved') && <ChevronRightIcon />}
                  </button>
                ))}
              </nav>
              
              <div className="flex items-center">
                <button 
                  className="md:hidden transition-transform duration-300 hover:scale-110"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <CloseIcon className="text-white drop-shadow-lg" />
                  ) : (
                    <MenuIcon className="text-white drop-shadow-lg" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu */}
          <div className={`md:hidden bg-black/80 backdrop-blur-md border-t border-white/20 overflow-hidden transition-all duration-500 ${
            mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <nav className="py-4 px-4 space-y-2">
              {['Explore', 'Saved', 'Maps', 'Community'].map((item) => (
                <a 
                  key={item} 
                  href="#" 
                  className="block py-3 text-white hover:text-green-300 font-medium transition-all duration-300 hover:translate-x-2"
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>
        </header>
        
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transform scale-110"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`
            }}
          />
          
          <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              Temukan <span className="text-green-400">Jalur Pendakian</span>
            </h1>
            <h2 className="text-3xl md:text-5xl font-bold mb-8">
              Gunung Indonesia
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              Database terlengkap informasi pendakian gunung di Nusantara
            </p>
            
            <div className="relative max-w-2xl mx-auto" ref={searchRef}>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 transition-all duration-300 group-hover:text-gray-600">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Cari nama gunung, kota, atau provinsi..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-12 pr-4 py-4 rounded-full text-gray-800 text-lg shadow-2xl focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-opacity-50 transition-all duration-300"
                  aria-label="Cari jalur pendakian gunung"
                />
              </div>
              
              {isClient && showDropdown && filteredMountains.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                  {filteredMountains.map((mountain) => (
                    <div
                      key={mountain?.id || Math.random()}
                      onClick={() => {
                        if (mountain?.id) {
                          window.location.href = `/mountains/${mountain.id}`;
                        }
                      }}
                      className="flex items-center p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-gray-800 transition-all duration-300 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gray-200 mr-3 flex items-center justify-center overflow-hidden">
                        {mountain?.image ? (
                          <Image
                            src={buildDirectImageUrl(mountain.image) || svgPlaceholder}
                            alt={`${mountain.name}`}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            unoptimized={true}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span className="text-2xl" style={{ display: mountain?.image ? 'none' : 'flex' }}>🏔️</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{mountain?.name || 'Unknown'}</h4>
                        <p className="text-sm text-gray-600">{mountain?.kota || 'Unknown'}, {mountain?.provinsi || 'Unknown'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <nav className="mt-6" aria-label="Quick links">
              <a href="#trails" className="text-white underline hover:no-underline text-lg transition-all duration-300 hover:scale-105">
                Jelajahi jalur pendakian terdekat
              </a>
            </nav>
          </div>
        </section>
        
        {/* Trails Section */}
        <section id="trails" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Jalur Pendakian Gunung Populer di <span className="text-green-600">Indonesia</span>
            </h2>
            <p className="text-gray-600 text-lg">Jelajahi {totalCount > 0 ? totalCount : safeMountains.length} gunung dengan jalur pendakian resmi di seluruh Nusantara</p>
          </div>
          
          {/* SEO Content Section */}
          <div className="mb-12 prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed">
              Indonesia memiliki lebih dari 400 gunung yang tersebar di berbagai pulau, menjadikannya surga bagi para pendaki dan pecinta alam. 
              Dari Sabang sampai Merauke, setiap gunung menawarkan keunikan tersendiri dengan jalur pendakian yang menantang dan pemandangan yang memukau.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <label htmlFor="province-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Filter berdasarkan Provinsi
              </label>
              <select
                id="province-filter"
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setCurrentPage(0);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-gray-400"
                aria-label="Filter gunung berdasarkan provinsi"
              >
                {uniqueProvinces.map(province => (
                  <option key={province} value={province}>
                    {province} {province === "All" ? `(${totalCount > 0 ? `${totalCount} total, menampilkan ${safeMountains.length}` : `${safeMountains.length} gunung`})` : `(${provinceCounts[province] || 0} gunung)`}
                  </option>
                ))}
              </select>
            </div>
            
            {totalPages > 1 && (
              <nav className="flex items-center space-x-3" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="p-3 rounded-full bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 hover:shadow-lg"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeftIcon />
                </button>
                
                <span className="text-sm text-gray-600 px-3 font-medium">
                  Halaman {currentPage + 1} dari {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="p-3 rounded-full bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 hover:shadow-lg"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRightIcon />
                </button>
              </nav>
            )}
          </div>
          
          {error ? (
            <div className="text-center py-12">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-yellow-800 font-medium mb-2">Data Tidak Tersedia</p>
                <p className="text-yellow-600 text-sm">
                  Data gunung tidak tersedia saat ini. Silakan coba lagi nanti.
                </p>
              </div>
            </div>
          ) : safeMountains.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-gray-600">Tidak ada data gunung yang tersedia.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
                {currentMountains.map((mountain, index) => (
                  <article key={mountain?.id || `mountain-${index}`} role="listitem">
                    <TrailCard 
                      mountain={mountain}
                      index={index}
                      availableMountains={safeMountains}
                    />
                  </article>
                ))}
              </div>
              
              {/* Show message about data limitation */}
              {totalCount > safeMountains.length && (
                <div className="mt-8 text-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                    <p className="text-blue-800 text-sm">
                      <strong>Menampilkan {safeMountains.length} dari {totalCount} gunung.</strong> 
                      <br />
                      Untuk performa optimal, kami membatasi tampilan data. Gunakan filter provinsi untuk melihat gunung spesifik.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Additional SEO Content */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Gunung Tertinggi di Jawa</h3>
              <p className="text-gray-600">
                Pulau Jawa memiliki beberapa gunung tertinggi seperti Gunung Semeru (3.676 mdpl), 
                Gunung Slamet (3.428 mdpl), dan Gunung Lawu (3.265 mdpl) yang menjadi favorit para pendaki.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Tips Pendakian Aman</h3>
              <p className="text-gray-600">
                Persiapkan fisik, peralatan, dan logistik dengan baik. Selalu ikuti jalur resmi, 
                patuhi peraturan setempat, dan jangan tinggalkan sampah di gunung.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Musim Pendakian Terbaik</h3>
              <p className="text-gray-600">
                April hingga Oktober adalah waktu terbaik untuk mendaki gunung di Indonesia, 
                dengan cuaca yang relatif cerah dan minim hujan.
              </p>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* FAQ Section for SEO */}
            <div className="mb-12 bg-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Pertanyaan Umum Seputar Pendakian Gunung di Indonesia</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Kapan waktu terbaik mendaki gunung di Indonesia?</h3>
                  <p className="text-gray-300 text-sm">Musim kemarau (April-Oktober) adalah waktu ideal untuk mendaki gunung di Indonesia dengan cuaca cerah dan jalur yang kering.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Apa saja persiapan mendaki gunung untuk pemula?</h3>
                  <p className="text-gray-300 text-sm">Persiapkan fisik, perlengkapan standar (tas carrier, sleeping bag, matras, jaket), logistik, dan selalu mendaki bersama kelompok.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Berapa biaya mendaki gunung di Indonesia?</h3>
                  <p className="text-gray-300 text-sm">Biaya bervariasi mulai dari Rp 50.000 - Rp 500.000 tergantung lokasi, termasuk tiket masuk, camping, dan porter (opsional).</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Gunung mana yang cocok untuk pendaki pemula?</h3>
                  <p className="text-gray-300 text-sm">Gunung Prau, Gunung Andong, Gunung Papandayan, dan Gunung Ijen adalah pilihan populer untuk pendaki pemula.</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { 
                  title: 'Jelajahi Gunung', 
                  items: [
                    { text: 'Gunung di Jawa Barat', href: '/provinsi/jawa-barat' },
                    { text: 'Gunung di Jawa Tengah', href: '/provinsi/jawa-tengah' },
                    { text: 'Gunung di Jawa Timur', href: '/provinsi/jawa-timur' },
                    { text: 'Semua Provinsi', href: '/provinsi' }
                  ] 
                },
                { 
                  title: 'Informasi Pendakian', 
                  items: [
                    { text: 'Tips Mendaki', href: '/tips' },
                    { text: 'Perlengkapan', href: '/perlengkapan' },
                    { text: 'Keselamatan', href: '/keselamatan' },
                    { text: 'Cuaca Gunung', href: '/cuaca' }
                  ] 
                },
                { 
                  title: 'Komunitas', 
                  items: [
                    { text: 'Forum Pendaki', href: '/forum' },
                    { text: 'Foto Pendakian', href: '/galeri' },
                    { text: 'Review Jalur', href: '/review' },
                    { text: 'Event Pendakian', href: '/event' }
                  ] 
                },
                { 
                  title: 'TrailView ID', 
                  items: [
                    { text: 'Tentang Kami', href: '/tentang' },
                    { text: 'Kontak', href: '/kontak' },
                    { text: 'Kebijakan Privasi', href: '/privacy' },
                    { text: 'Syarat & Ketentuan', href: '/terms' }
                  ] 
                }
              ].map((section, index) => (
                <div key={section.title}>
                  <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
                  <ul className="space-y-2 text-gray-400">
                    {section.items.map(item => (
                      <li key={item.text}>
                        <a 
                          href={item.href} 
                          className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                          title={item.text}
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-800">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-400 text-center md:text-left mb-4 md:mb-0">
                  &copy; 2025 TrailView ID. Hak cipta dilindungi. TrailView ID adalah platform informasi jalur pendakian gunung terlengkap di Indonesia.
                </p>
                <div className="flex space-x-6">
                  <a href="https://facebook.com/trailviewid" className="text-gray-400 hover:text-white" aria-label="Facebook TrailView ID">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a href="https://instagram.com/trailviewid" className="text-gray-400 hover:text-white" aria-label="Instagram TrailView ID">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </a>
                  <a href="https://twitter.com/trailviewid" className="text-gray-400 hover:text-white" aria-label="Twitter TrailView ID">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes color-change {
          0%, 100% { color: #059669; }
          50% { color: #10b981; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        
        .animate-fade-in-up-delay {
          animation: fade-in-up 0.8s ease-out 0.2s both;
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        
        .animate-color-change {
          animation: color-change 3s ease-in-out infinite;
        }
        
        .hover\:shadow-3xl:hover {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </>
  );
}

export async function getStaticProps() {
  try {
    console.log('Fetching mountains data from API...');
    const res = await fetch("https://adrianfirmansyah-website.my.id/trailview/items/mountains");
    
    if (!res.ok) {
      throw new Error(`API response error: ${res.status} ${res.statusText}`);
    }
    
    const jsonData = await res.json();
    const fullMountains = Array.isArray(jsonData?.data) ? jsonData.data : [];
    
    // Optimize data - only keep essential fields and limit to first 20 mountains
    const mountains = fullMountains.slice(0, 20).map(mountain => ({
      id: mountain.id,
      name: mountain.name,
      kota: mountain.kota,
      provinsi: mountain.provinsi,
      elevation: mountain.elevation,
      difficulty: mountain.difficulty,
      rating: mountain.rating,
      image: mountain.image
    }));
    
    console.log('Optimized mountains count:', mountains.length);
    console.log('Total available mountains:', fullMountains.length);
    
    if (mountains.length > 0) {
      console.log('Sample mountain data:', mountains[0]);
    }

    return {
      props: {
        mountains,
        totalCount: fullMountains.length, // Include total count for display
      },
      revalidate: 300, // Revalidate every 5 minutes
    };
  } catch (error) {
    console.error("Failed to fetch mountains data:", error);

    return {
      props: {
        mountains: [],
        totalCount: 0,
        error: "Unable to fetch mountains data",
      },
      revalidate: 60, // Retry sooner if error
    };
  }
}
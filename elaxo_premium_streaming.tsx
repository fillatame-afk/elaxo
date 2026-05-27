import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Search, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, 
  Info, Star, Film, Tv, Plus, Check, History, Bookmark, 
  ArrowLeft, Loader2, Video, Home, X, Settings, LayoutGrid, ChevronRight
} from 'lucide-react';

const TMDB_API_KEY = "3e20e76d6d210b6cb128d17d233b64dc";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMG_URL = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP_URL = "https://image.tmdb.org/t/p/original";

const ROW_REQUESTS = [
  { id: 'trending', title: 'Trending Now', url: `/trending/all/day?api_key=${TMDB_API_KEY}` },
  { id: 'originals', title: 'ELAXO Originals', url: `/discover/tv?api_key=${TMDB_API_KEY}&with_networks=213` },
  { id: 'top_rated', title: 'Critically Acclaimed', url: `/movie/top_rated?api_key=${TMDB_API_KEY}` },
  { id: 'action', title: 'Action & Adventure', url: `/discover/movie?api_key=${TMDB_API_KEY}&with_genres=28` },
  { id: 'comedy', title: 'Comedies', url: `/discover/movie?api_key=${TMDB_API_KEY}&with_genres=35` },
  { id: 'horror', title: 'Horror Movies', url: `/discover/movie?api_key=${TMDB_API_KEY}&with_genres=27` },
  { id: 'romance', title: 'Romantic Favorites', url: `/discover/movie?api_key=${TMDB_API_KEY}&with_genres=10749` },
  { id: 'documentaries', title: 'Documentaries', url: `/discover/movie?api_key=${TMDB_API_KEY}&with_genres=99` },
];

/* =========================================
   CUSTOM HOOKS
========================================= */

const useSEO = ({ title, description, image }) => {
  useEffect(() => {
    const siteName = "ELAXO";
    const fullTitle = title ? `${title} | ${siteName}` : `${siteName} — Watch TV Shows Online, Watch Movies Online`;
    document.title = fullTitle;

    const setMetaTag = (attrName, attrValue, content) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMetaTag('name', 'description', description || 'Watch anywhere. Cancel anytime. ELAXO provides premium 4K streaming for movies, TV series, and documentaries.');
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description || 'Premium Streaming on ELAXO.');
    setMetaTag('property', 'og:type', 'website');
    if (image) setMetaTag('property', 'og:image', image);
  }, [title, description, image]);
};

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(error);
    }
  };

  return [storedValue, setValue];
};

/* =========================================
   UI COMPONENTS
========================================= */

const Header = ({ activePage, navigate, searchQuery, setSearchQuery, isMobileSearchOpen, setIsMobileSearchOpen }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled || isMobileSearchOpen ? 'bg-[#141414] shadow-lg shadow-black/50' : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'} h-16 md:h-20 flex items-center px-4 md:px-12`}>
        <div className="flex items-center justify-between w-full max-w-[1920px] mx-auto gap-4">
          
          <div className="flex items-center gap-10">
            <div onClick={() => { setIsMobileSearchOpen(false); navigate('home'); }} className="cursor-pointer text-2xl md:text-3xl font-black text-[#E50914] tracking-tighter shrink-0">
              ELAXO
            </div>

            <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-gray-200">
              <button onClick={() => navigate('home')} className={`transition-colors ${activePage === 'home' ? 'text-white font-bold' : 'hover:text-gray-400'}`}>Home</button>
              <button onClick={() => navigate('movies')} className={`transition-colors ${activePage === 'movies' ? 'text-white font-bold' : 'hover:text-gray-400'}`}>Movies</button>
              <button onClick={() => navigate('tv')} className={`transition-colors ${activePage === 'tv' ? 'text-white font-bold' : 'hover:text-gray-400'}`}>TV Shows</button>
              <button onClick={() => navigate('watchlist')} className={`transition-colors ${activePage === 'watchlist' ? 'text-white font-bold' : 'hover:text-gray-400'}`}>My List</button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center relative group">
              <Search className="w-5 h-5 text-white absolute left-3 pointer-events-none transition-opacity group-focus-within:opacity-100 opacity-60" />
              <input
                type="text"
                placeholder="Titles, people, genres"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black/50 border border-white/20 text-white text-sm h-9 pl-10 pr-4 rounded-sm focus:w-72 focus:bg-black focus:border-white transition-all duration-300 w-48 outline-none"
              />
            </div>
            {/* Mobile Search Toggle */}
            <button 
              className="md:hidden text-white p-2"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            >
              {isMobileSearchOpen ? <X size={24} /> : <Search size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Search Bar Dropdown */}
      <div className={`fixed top-16 left-0 right-0 z-40 bg-[#141414] p-4 transition-all duration-300 transform border-b border-white/10 md:hidden ${isMobileSearchOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search for movies, TV shows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#2b2b2b] text-white text-sm h-12 pl-10 pr-4 rounded-md focus:ring-1 focus:ring-white outline-none"
            autoFocus={isMobileSearchOpen}
          />
        </div>
      </div>
    </>
  );
};

const MobileBottomNav = ({ activePage, navigate, setIsMobileSearchOpen }) => {
  const navItems = [
    { id: 'home', icon: Home, label: "Home" },
    { id: 'movies', icon: Film, label: "Movies" },
    { id: 'tv', icon: Tv, label: "TV Shows" },
    { id: 'watchlist', icon: Bookmark, label: "My List" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#141414]/95 backdrop-blur-xl border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around py-3">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              setIsMobileSearchOpen(false);
              navigate(item.id);
            }}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${activePage === item.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <item.icon size={22} className={activePage === item.id ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const MovieCard = ({ movie, onSelect }) => (
  <div 
    onClick={() => onSelect(movie)}
    className="group cursor-pointer relative transition-all duration-300 hover:scale-105 hover:z-20 w-full"
  >
    <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-[#2b2b2b]">
      <img 
        src={movie.image} 
        alt={movie.title}
        className="w-full h-full object-cover transition-opacity duration-300"
        loading="lazy"
      />
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        <div className="bg-[#E50914] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase tracking-wider">
          {movie.quality}
        </div>
      </div>
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50">
          <Play className="text-white fill-current ml-1" size={20} />
        </div>
      </div>
    </div>
  </div>
);

const HorizontalRow = ({ title, movies, onSelect }) => {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="mb-8 md:mb-12 relative group">
      <h2 className="text-base md:text-xl font-bold text-white mb-2 md:mb-4 px-4 md:px-12">{title}</h2>
      
      {/* Desktop Scroll Buttons */}
      <button 
        onClick={() => scroll('left')}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 w-12 h-full bg-black/50 hover:bg-black/80 items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={32} className="rotate-180" />
      </button>
      <button 
        onClick={() => scroll('right')}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-30 w-12 h-full bg-black/50 hover:bg-black/80 items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={32} />
      </button>

      <div 
        ref={rowRef}
        className="flex overflow-x-auto gap-2 md:gap-3 px-4 md:px-12 pb-4 snap-x snap-mandatory hide-scrollbar"
      >
        {movies.map(movie => (
          <div key={movie.id} className="snap-start shrink-0 w-[110px] sm:w-[140px] md:w-[180px] lg:w-[220px]">
            <MovieCard movie={movie} onSelect={onSelect} />
          </div>
        ))}
      </div>
    </div>
  );
};

const CustomVideoPlayer = ({ streams, title, selectedEpisodeInfo, onPlayStarted }) => {
  const [currentStream, setCurrentStream] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (streams && streams.length > 0) {
      const sorted = [...streams].sort((a, b) => b.resolution - a.resolution);
      setCurrentStream(sorted[0]);
    }
  }, [streams]);

  useEffect(() => {
    if (videoRef.current && currentStream) {
      const prevTime = currentTime;
      videoRef.current.src = currentStream.url;
      videoRef.current.load();
      if (prevTime > 0) videoRef.current.currentTime = prevTime;
      if (isPlaying) videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentStream]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(e => console.log(e));
      setIsPlaying(true);
      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        onPlayStarted(); 
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      const newTime = parseFloat(e.target.value);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  const formatTime = (s) => {
    if (isNaN(s)) return "00:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return h > 0 ? `${h.toString().padStart(2, '0')}:${m}:${sec}` : `${m}:${sec}`;
  };

  if (!currentStream) {
    return (
      <div className="aspect-video bg-[#141414] flex flex-col items-center justify-center border border-white/5">
        <Loader2 className="animate-spin text-[#E50914] mb-4" size={40} />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video bg-black overflow-hidden group select-none shadow-2xl"
    >
      <video ref={videoRef} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onClick={togglePlay} className="w-full h-full object-contain cursor-pointer" playsInline />
      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`} />
      
      <div className={`absolute top-0 left-0 right-0 p-4 flex items-center justify-between transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-white font-bold text-sm md:text-base drop-shadow-md">
          {title} {selectedEpisodeInfo && <span className="text-gray-300 font-normal">| {selectedEpisodeInfo}</span>}
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <button onClick={togglePlay} className={`w-16 h-16 bg-black/50 backdrop-blur border border-white/20 text-white rounded-full flex items-center justify-center pointer-events-auto transform transition-all ${!isPlaying || showControls ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
          {isPlaying ? <Pause className="fill-current" size={28} /> : <Play className="fill-current ml-1" size={28} />}
        </button>
      </div>

      <div className={`absolute bottom-0 left-0 right-0 p-4 md:px-6 transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-3 md:gap-4 mb-2">
          <span className="text-[10px] md:text-xs font-medium text-white shadow-sm">{formatTime(currentTime)}</span>
          <input type="range" min="0" max={duration || 100} step="0.1" value={currentTime} onChange={handleSeek} className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#E50914] outline-none" />
          <span className="text-[10px] md:text-xs font-medium text-gray-300 shadow-sm">{formatTime(duration)}</span>
        </div>
        <div className="flex items-center justify-between mt-4">
          <button onClick={togglePlay} className="text-white hover:text-gray-300 hidden md:block">{isPlaying ? <Pause size={22} /> : <Play size={22} />}</button>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="relative">
              <button onClick={() => setShowQualityMenu(!showQualityMenu)} className="text-xs font-bold text-white hover:text-gray-300 px-2 flex items-center gap-1">
                <Settings size={16} /> {currentStream.resolution}p
              </button>
              {showQualityMenu && (
                <div className="absolute bottom-8 right-0 bg-[#141414] border border-white/10 rounded-md p-1 w-28 shadow-2xl z-50">
                  {streams.map((st) => (
                    <button key={st.id} onClick={() => { setCurrentStream(st); setShowQualityMenu(false); }} className={`w-full text-left px-3 py-2 rounded text-xs font-medium transition-all ${currentStream.id === st.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                      {st.resolution}p
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={toggleFullscreen} className="text-white hover:text-gray-300">{isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MovieDetails = ({ movie, navigate, watchlist, setWatchlist, history, setHistory }) => {
  useSEO({ title: movie.title, description: movie.description, image: movie.backdrop || movie.image });

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [loading, setLoading] = useState(false);
  const [streams, setStreams] = useState([]);
  const [playbackActive, setPlaybackActive] = useState(false);
  const [tvSeasons, setTvSeasons] = useState(null);

  const playerSectionRef = useRef(null);
  const isWatchlisted = watchlist.some(m => m.id === movie.id);

  const toggleWatchlist = () => {
    if (isWatchlisted) setWatchlist(watchlist.filter(m => m.id !== movie.id));
    else setWatchlist([movie, ...watchlist]);
  };

  const handlePlayStarted = () => {
    const newHistory = history.filter(m => m.id !== movie.id);
    setHistory([movie, ...newHistory].slice(0, 50));
  };

  useEffect(() => {
    if (movie.type === 'TV') {
      fetch(`${TMDB_BASE_URL}/tv/${movie.id}?api_key=${TMDB_API_KEY}`)
        .then(res => res.json())
        .then(data => {
          if (data.seasons) {
            const mappedSeasons = data.seasons.filter(s => s.season_number > 0).map(s => ({
              seasonNum: s.season_number,
              episodes: Array.from({length: s.episode_count}, (_, i) => i + 1)
            }));
            setTvSeasons(mappedSeasons);
            if (mappedSeasons.length > 0) {
              setSelectedSeason(mappedSeasons[0].seasonNum);
              setSelectedEpisode(mappedSeasons[0].episodes[0]);
            }
          }
        }).catch(err => console.error(err));
    }
  }, [movie]);

  const fetchStreams = async () => {
    setLoading(true); setPlaybackActive(true);
    let url = `https://sparkling-mode-a1ed.fillatame.workers.dev/?title=${encodeURIComponent(movie.title)}`;
    if (movie.type === 'TV') url += `&season=${selectedSeason}&episode=${selectedEpisode}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("API Error");
      const data = await res.json();
      if (data.streams && data.streams.length > 0) setStreams(data.streams);
      else throw new Error("No streams");
    } catch (err) {
      console.warn("Stream API fallback for demo.");
      setStreams([{ format: "MP4", id: "1", url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4", resolution: 720, codecName: "h264" }]);
    } finally {
      setLoading(false);
      setTimeout(() => playerSectionRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const currentSeasonData = useMemo(() => {
    if (!tvSeasons) return null;
    return tvSeasons.find(s => s.seasonNum === selectedSeason) || tvSeasons[0];
  }, [tvSeasons, selectedSeason]);

  return (
    <div className="bg-[#141414] min-h-screen pb-24 md:pb-10 animate-in fade-in duration-500">
      
      {/* Detail Hero Section */}
      <div className="relative w-full h-[65vh] md:h-[80vh]">
        <img src={movie.backdrop || movie.image} className="w-full h-full object-cover hidden md:block" alt="backdrop" />
        <img src={movie.image} className="w-full h-full object-cover md:hidden" alt="poster" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent hidden md:block" />

        <button onClick={() => navigate('home')} className="absolute top-20 left-4 md:left-12 z-10 p-2 bg-black/50 rounded-full text-white backdrop-blur-sm hover:bg-white/20 transition-colors">
          <ArrowLeft size={24} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-12 md:max-w-4xl space-y-4">
          <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
            {movie.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-medium text-white drop-shadow-md">
            <span className="text-[#46d369] font-bold">98% Match</span>
            <span>{movie.year}</span>
            <span className="px-1.5 py-0.5 border border-gray-400 text-gray-200 rounded-sm uppercase text-[10px]">{movie.quality}</span>
            <span>{movie.duration}</span>
            <span className="px-1 py-0.5 bg-gray-800 rounded-sm text-[10px] text-gray-300 border border-gray-600">HD</span>
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-2">
            <button onClick={fetchStreams} className="w-full md:w-auto bg-white hover:bg-white/80 text-black font-bold py-3 md:py-2.5 px-8 rounded-md flex items-center justify-center gap-2 transition-colors">
              <Play className="fill-current" size={24} /> Play
            </button>
            <button onClick={toggleWatchlist} className="w-full md:w-auto bg-[#333]/80 hover:bg-[#333] text-white font-bold py-3 md:py-2.5 px-8 rounded-md flex items-center justify-center gap-2 transition-colors border border-white/10 backdrop-blur">
              {isWatchlisted ? <Check size={24} /> : <Plus size={24} />} My List
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-12 py-4 max-w-7xl mx-auto space-y-8">
        
        <p className="text-gray-300 text-sm md:text-lg leading-relaxed md:max-w-3xl font-light">
          {movie.description}
        </p>

        {/* Video Player Area */}
        <div ref={playerSectionRef} className="scroll-mt-24">
          {playbackActive && (
            <div className="w-full md:max-w-5xl mx-auto rounded-md overflow-hidden bg-black shadow-2xl">
              {loading ? (
                <div className="aspect-video flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="animate-spin text-[#E50914]" size={40} />
                </div>
              ) : (
                <CustomVideoPlayer streams={streams} title={movie.title} selectedEpisodeInfo={movie.type === 'TV' ? `S${selectedSeason} E${selectedEpisode}` : null} onPlayStarted={handlePlayStarted} />
              )}
            </div>
          )}
        </div>

        {/* TV Series Selector */}
        {movie.type === 'TV' && tvSeasons && (
          <div className="pt-6 border-t border-white/10 space-y-6 md:max-w-5xl">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Episodes</h3>
              
              <div className="relative">
                <select 
                  value={selectedSeason}
                  onChange={(e) => {
                    setSelectedSeason(Number(e.target.value));
                    setSelectedEpisode(1);
                    if(playbackActive) setTimeout(fetchStreams, 100);
                  }}
                  className="bg-[#2b2b2b] text-white text-base font-medium py-2 px-4 rounded-md outline-none appearance-none pr-10 cursor-pointer border border-white/10"
                >
                  {tvSeasons.map((s) => (
                    <option key={s.seasonNum} value={s.seasonNum}>Season {s.seasonNum}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white">
                  ▼
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {currentSeasonData && currentSeasonData.episodes.map((ep) => (
                <div 
                  key={ep}
                  onClick={() => { setSelectedEpisode(ep); if(playbackActive) setTimeout(fetchStreams, 100); else fetchStreams(); }}
                  className={`flex flex-row items-center gap-4 p-4 rounded-md cursor-pointer transition-colors ${selectedEpisode === ep ? 'bg-[#333]' : 'hover:bg-[#2b2b2b]'}`}
                >
                  <span className="text-xl font-bold text-gray-500 w-8 text-center">{ep}</span>
                  <div className="relative w-32 h-20 bg-[#141414] rounded overflow-hidden shrink-0 hidden sm:block">
                    <img src={movie.backdrop || movie.image} className="w-full h-full object-cover opacity-50" alt="" />
                    <Play size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/80" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white">Episode {ep}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LegalPageLayout = ({ title, children }) => (
  <div className="min-h-screen bg-[#141414] pt-28 pb-20 px-6 md:px-12">
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
      <h1 className="text-3xl md:text-5xl font-black text-white">{title}</h1>
      <div className="prose prose-invert prose-p:text-gray-300 prose-h2:text-white prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4">
        {children}
      </div>
    </div>
  </div>
);

const FAQPage = () => {
  useSEO({ title: 'FAQ' });
  return (
    <LegalPageLayout title="Frequently Asked Questions">
      <h2>What is ELAXO?</h2>
      <p>ELAXO is a premium streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries, and more on thousands of internet-connected devices. You can watch as much as you want, whenever you want – all beautifully designed.</p>
      
      <h2>How much does ELAXO cost?</h2>
      <p>Currently, ELAXO operates as an open-access platform. There are no hidden fees, no subscriptions, and no cancellation procedures. Enjoy the content seamlessly.</p>
      
      <h2>Where can I watch?</h2>
      <p>Watch anywhere, anytime. Access ELAXO right from your personal computer or on any internet-connected device that offers a web browser, including smart TVs, smartphones, tablets, and streaming media players.</p>
      
      <h2>How do I change the video quality?</h2>
      <p>While watching any title, look for the gear icon (Settings) in the bottom right corner of the video player. Click it to reveal quality options ranging from 360p to 1080p. The player will remember your playback position when switching qualities.</p>
    </LegalPageLayout>
  );
};

const HelpCenterPage = () => {
  useSEO({ title: 'Help Center' });
  return (
    <LegalPageLayout title="Help Center">
      <h2>Video Playback Issues</h2>
      <p>If you are experiencing buffering, pausing, or a black screen while trying to watch a movie or TV show, please try the following troubleshooting steps:</p>
      <ul>
        <li><strong>Refresh the page:</strong> A simple refresh often resolves temporary connection drops.</li>
        <li><strong>Lower the video quality:</strong> Click the gear icon in the player and select a lower resolution (e.g., 480p or 360p) if your internet connection is unstable.</li>
        <li><strong>Clear browser cache:</strong> Sometimes outdated temporary files can interfere with the streaming engine.</li>
      </ul>

      <h2>Missing Episodes or Seasons</h2>
      <p>Our database synchronizes with TMDB (The Movie Database). If a season or episode was recently released, it may take up to 24 hours to propagate through the streaming servers.</p>

      <h2>Audio/Video Out of Sync</h2>
      <p>If the audio doesn't match the video, try pausing the video for 10 seconds and then resuming. If the problem persists, try switching to a different quality stream.</p>
    </LegalPageLayout>
  );
};

const TermsOfUsePage = () => {
  useSEO({ title: 'Terms of Use' });
  return (
    <LegalPageLayout title="Terms of Use">
      <p>Welcome to ELAXO. These Terms of Use govern your use of our service. As used in these Terms of Use, "ELAXO service", "our service" or "the service" means the personalized service provided by ELAXO for discovering and accessing ELAXO content.</p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>By using the ELAXO service, you accept and agree to be bound by these Terms of Use. If you do not agree to these Terms of Use, you may not access or use the service.</p>

      <h2>2. Nature of the Service</h2>
      <p>ELAXO acts as an aggregator and UI interface for third-party streaming links. ELAXO does not host, upload, or manage any of the media files streamed through the video player. All content is indexed automatically by web crawlers.</p>

      <h2>3. User Data and Privacy</h2>
      <p>Your watch history and saved lists are stored locally on your device using Browser LocalStorage. Clearing your browser data will result in the loss of this information. We do not maintain centralized user accounts.</p>

      <h2>4. Changes to Terms of Use</h2>
      <p>ELAXO may, from time to time, change these Terms of Use. We will notify you at least 30 days before these new Terms of Use apply to you.</p>
    </LegalPageLayout>
  );
};

const PrivacyPolicyPage = () => {
  useSEO({ title: 'Privacy Policy' });
  return (
    <LegalPageLayout title="Privacy Statement">
      <p>This Privacy Statement explains our practices regarding the collection, use, and disclosure of certain information, including your personal information, by ELAXO.</p>
      
      <h2>Information We Do Not Collect</h2>
      <p>Because ELAXO operates without a centralized user account system, we <strong>do not</strong> collect your name, email address, physical address, or payment information.</p>

      <h2>Local Storage Usage</h2>
      <p>To provide a personalized experience, ELAXO uses your browser's Local Storage to save:</p>
      <ul>
        <li>Your Watchlist (My List) items.</li>
        <li>Your recently viewed History.</li>
      </ul>
      <p>This data never leaves your device and is never transmitted to our servers. You have full control over this data and can delete it at any time by clearing your browser's cache and local storage.</p>

      <h2>Third-Party Services</h2>
      <p>We utilize The Movie Database (TMDB) API to fetch posters, descriptions, and metadata. By using ELAXO, your device may make direct requests to TMDB servers. Please review TMDB's privacy policy for details on how they handle API requests.</p>
    </LegalPageLayout>
  );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  // Data States
  const [homeRows, setHomeRows] = useState([]);
  const [gridContent, setGridContent] = useState([]);
  const [gridPage, setGridPage] = useState(1);
  const [isFetching, setIsFetching] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Persistent State
  const [watchlist, setWatchlist] = useLocalStorage('elaxo_watchlist', []);
  const [history, setHistory] = useLocalStorage('elaxo_history', []);

  const observerTarget = useRef(null);

  // Helper to map TMDB data safely
  const mapTMDBData = useCallback((results) => {
    return results.filter(item => item.media_type !== 'person' && item.poster_path).map(item => {
      const isTv = item.media_type === 'tv' || item.first_air_date;
      return {
        id: item.id,
        title: item.title || item.name,
        year: (item.release_date || item.first_air_date || "").split('-')[0],
        rating: item.vote_average ? item.vote_average.toFixed(1) : "N/A",
        type: isTv ? 'TV' : 'Movie',
        quality: "HD",
        duration: isTv ? "TV Series" : "Movie",
        image: `${TMDB_IMG_URL}${item.poster_path}`,
        backdrop: item.backdrop_path ? `${TMDB_BACKDROP_URL}${item.backdrop_path}` : `${TMDB_IMG_URL}${item.poster_path}`,
        description: item.overview || "No description available.",
      };
    });
  }, []);

  // Primary Navigation
  const navigate = useCallback((page, data = null) => {
    setCurrentPage(page);
    setSelectedMovie(data);
    setSearchQuery('');
    setGridPage(1); // Reset pagination on navigation
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // SEO
  const pageTitles = { home: 'Home', movies: 'Movies', tv: 'TV Shows', watchlist: 'My List', history: 'History', details: selectedMovie?.title };
  useSEO({ title: pageTitles[currentPage] || '' });

  useEffect(() => {
    if (currentPage === 'home' && !searchQuery) {
      const fetchHomeData = async () => {
        setIsFetching(true);
        try {
          const promises = ROW_REQUESTS.map(req => fetch(`${TMDB_BASE_URL}${req.url}`).then(res => res.json()));
          const results = await Promise.all(promises);
          
          const formattedRows = results.map((res, index) => ({
            id: ROW_REQUESTS[index].id,
            title: ROW_REQUESTS[index].title,
            items: mapTMDBData(res.results)
          })).filter(row => row.items.length > 0);

          setHomeRows(formattedRows);
        } catch (error) {
          console.error("Error fetching home rows:", error);
        } finally {
          setIsFetching(false);
        }
      };
      fetchHomeData();
    }
  }, [currentPage, searchQuery, mapTMDBData]);

  useEffect(() => {
    if (['home', 'details', 'watchlist', 'history', 'faq', 'help', 'terms', 'privacy'].includes(currentPage) && !searchQuery) return;

    const fetchGridData = async () => {
      gridPage === 1 ? setIsFetching(true) : setIsLoadingMore(true);
      let url = '';
      
      if (searchQuery) {
        url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&include_adult=false&page=${gridPage}`;
      } else {
        switch (currentPage) {
          case 'movies': url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=${gridPage}`; break;
          case 'tv': url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=${gridPage}`; break;
        }
      }

      try {
        if (url) {
          const res = await fetch(url);
          const data = await res.json();
          const mapped = mapTMDBData(data.results);
          
          if (gridPage === 1) {
            setGridContent(mapped);
          } else {
            setGridContent(prev => [...prev, ...mapped]);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsFetching(false);
        setIsLoadingMore(false);
      }
    };

    const timeoutId = setTimeout(fetchGridData, searchQuery ? 600 : 0);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentPage, gridPage, mapTMDBData]);

  // Infinite Scroll Observer for Grid Views
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isFetching && !isLoadingMore && gridContent.length > 0) {
          setGridPage(prev => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [observerTarget, isFetching, isLoadingMore, gridContent.length]);

  const renderPage = () => {
    // Static Pages
    if (currentPage === 'details') return <MovieDetails movie={selectedMovie} navigate={navigate} watchlist={watchlist} setWatchlist={setWatchlist} history={history} setHistory={setHistory} />;
    if (currentPage === 'faq') return <FAQPage />;
    if (currentPage === 'help') return <HelpCenterPage />;
    if (currentPage === 'terms') return <TermsOfUsePage />;
    if (currentPage === 'privacy') return <PrivacyPolicyPage />;

    // Home Page Rows View
    if (currentPage === 'home' && !searchQuery) {
      if (isFetching) {
        return <div className="w-full h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#E50914]" size={50} /></div>;
      }

      const heroMovie = homeRows[0]?.items[0];

      return (
        <div className="animate-in fade-in duration-700 pb-24 md:pb-10">
          {heroMovie && (
            <div className="relative w-full h-[75vh] md:h-[85vh] mb-8 group">
              <img src={heroMovie.backdrop} className="w-full h-full object-cover" alt="Hero" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#000000]/80 via-[#000000]/40 to-transparent hidden md:block" />
              
              <div className="absolute bottom-10 md:bottom-20 left-0 right-0 px-4 md:px-12 flex flex-col items-center md:items-start text-center md:text-left z-10 space-y-4">
                <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-xl max-w-3xl">
                  {heroMovie.title}
                </h2>
                <div className="flex items-center gap-2 text-sm font-bold text-white mb-2 drop-shadow-md">
                  <span className="text-[#46d369]">98% Match</span>
                  <span>{heroMovie.year}</span>
                  <span className="border border-gray-400 px-1.5 rounded-sm text-xs">HD</span>
                </div>
                <p className="hidden md:block text-gray-200 max-w-2xl text-lg font-medium drop-shadow-md mb-4 line-clamp-3">
                  {heroMovie.description}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4 w-full md:w-auto pt-2">
                  <button onClick={() => navigate('details', heroMovie)} className="bg-white hover:bg-white/80 text-black font-bold py-2.5 md:py-3 px-8 md:px-10 rounded flex items-center justify-center gap-2 transition-colors text-base">
                    <Play className="fill-current" size={24} /> Play
                  </button>
                  <button onClick={() => navigate('details', heroMovie)} className="bg-gray-500/50 hover:bg-gray-500/70 text-white font-bold py-2.5 md:py-3 px-8 md:px-10 rounded flex items-center justify-center gap-2 transition-colors text-base backdrop-blur-md">
                    <Info size={24} /> More Info
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="-mt-12 md:-mt-32 relative z-20">
            {homeRows.map(row => (
              <HorizontalRow key={row.id} title={row.title} movies={row.items} onSelect={(m) => navigate('details', m)} />
            ))}
          </div>
        </div>
      );
    }

    // Grid View for Movies, TV, Watchlist, Search
    let displayData = gridContent;
    let titleStr = '';
    
    if (searchQuery) titleStr = `Search Results: "${searchQuery}"`;
    else if (currentPage === 'watchlist') { displayData = watchlist; titleStr = 'My List'; }
    else if (currentPage === 'history') { displayData = history; titleStr = 'Watch History'; }
    else if (currentPage === 'movies') titleStr = 'Movies';
    else if (currentPage === 'tv') titleStr = 'TV Shows';

    return (
      <div className="animate-in fade-in duration-700 pb-24 md:pb-10 pt-24 px-4 md:px-12 min-h-screen">
        <h2 className="text-xl md:text-3xl font-bold text-white mb-8">{titleStr}</h2>

        {isFetching && gridPage === 1 ? (
          <div className="w-full py-32 flex justify-center">
            <Loader2 className="animate-spin text-[#E50914]" size={50} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {displayData.length === 0 ? (
                <div className="col-span-full py-20 text-center text-gray-400 text-lg">
                  {searchQuery ? "No matches found." : "List is empty."}
                </div>
              ) : (
                displayData.map(movie => <MovieCard key={`${movie.id}-${Math.random()}`} movie={movie} onSelect={(m) => navigate('details', m)} />)
              )}
            </div>
            
            {/* Infinite Scroll Target */}
            {!['watchlist', 'history'].includes(currentPage) && displayData.length > 0 && (
              <div ref={observerTarget} className="w-full py-10 flex justify-center">
                {isLoadingMore && <Loader2 className="animate-spin text-[#E50914]" size={30} />}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#000000] text-gray-100 font-['Inter',sans-serif] selection:bg-[#E50914]/30">
      <Header 
        activePage={currentPage} 
        navigate={navigate} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        isMobileSearchOpen={isMobileSearchOpen}
        setIsMobileSearchOpen={setIsMobileSearchOpen}
      />
      
      <main className="w-full">
        {renderPage()}
      </main>

      {/* Modern Footer with working links */}
      {currentPage !== 'details' && (
        <footer className="px-4 md:px-12 pb-28 md:pb-16 pt-16 mt-10 border-t border-white/10 max-w-7xl mx-auto text-gray-500">
          <p className="mb-6 text-sm text-center md:text-left">Questions? Contact us.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
            <button onClick={() => navigate('faq')} className="text-left hover:underline w-fit">FAQ</button>
            <button onClick={() => navigate('help')} className="text-left hover:underline w-fit">Help Center</button>
            <button onClick={() => navigate('terms')} className="text-left hover:underline w-fit">Terms of Use</button>
            <button onClick={() => navigate('privacy')} className="text-left hover:underline w-fit">Privacy</button>
            <button onClick={() => navigate('home')} className="text-left hover:underline w-fit">Ways to Watch</button>
            <button onClick={() => navigate('home')} className="text-left hover:underline w-fit">Corporate Information</button>
            <button onClick={() => navigate('home')} className="text-left hover:underline w-fit">Only on ELAXO</button>
          </div>
          <p className="mt-10 text-xs text-center md:text-left">© {new Date().getFullYear()} ELAXO, Inc.</p>
        </footer>
      )}

      <MobileBottomNav activePage={currentPage} navigate={navigate} setIsMobileSearchOpen={setIsMobileSearchOpen} />

      <style>{`
        body { background-color: #000000; overscroll-behavior-y: none; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #555; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-in { animation: fade-in 0.4s ease-out forwards; }
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        }
      `}</style>
    </div>
  );
}
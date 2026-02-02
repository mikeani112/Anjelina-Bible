
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import BibleReader from './components/BibleReader';
import PrayerJournal from './components/PrayerJournal';
import Settings from './components/Settings';
import { Language, SavedVerse } from './types';
import { Bell, Bookmark, Highlighter, Trash2, ChevronRight, BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [fontSize, setFontSize] = useState(18);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('angelina_bible_dark_mode');
    return saved === 'true';
  });
  
  // Lifted state for saved content (bookmarks + highlights)
  const [savedItems, setSavedItems] = useState<Record<string, SavedVerse>>({});

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('angelina_bible_saved_content');
    if (saved) {
      try {
        setSavedItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved content", e);
      }
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('angelina_bible_saved_content', JSON.stringify(savedItems));
  }, [savedItems]);

  // Sync dark mode to localStorage and document class
  useEffect(() => {
    localStorage.setItem('angelina_bible_dark_mode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleBookmark = (item: Omit<SavedVerse, 'timestamp' | 'isBookmarked'>) => {
    setSavedItems(prev => {
      const next = { ...prev };
      const existing = next[item.key];
      
      if (existing) {
        if (existing.isBookmarked) {
          // If it was bookmarked, and we're toggling it off...
          if (!existing.highlightColor) {
            // ...and it has no highlight, delete it entirely
            delete next[item.key];
          } else {
            // ...but it has a highlight, just remove the bookmark flag
            next[item.key] = { ...existing, isBookmarked: false };
          }
        } else {
          // It existed (maybe as a highlight), now bookmark it
          next[item.key] = { ...existing, isBookmarked: true, timestamp: Date.now() };
        }
      } else {
        // New save
        next[item.key] = { ...item, isBookmarked: true, timestamp: Date.now() };
      }
      return next;
    });
  };

  const updateHighlight = (item: Omit<SavedVerse, 'timestamp' | 'isBookmarked'>, color: string | undefined) => {
    setSavedItems(prev => {
      const next = { ...prev };
      const existing = next[item.key];
      
      if (color) {
        // Applying a color
        next[item.key] = {
          ...(existing || { ...item, isBookmarked: false }),
          highlightColor: color,
          timestamp: existing?.timestamp || Date.now()
        };
      } else {
        // Removing color
        if (existing) {
          if (!existing.isBookmarked) {
            delete next[item.key];
          } else {
            const updated = { ...existing };
            delete updated.highlightColor;
            next[item.key] = updated;
          }
        }
      }
      return next;
    });
  };

  const removeItem = (key: string) => {
    setSavedItems(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const FavoritesView = () => {
    const items = (Object.values(savedItems) as SavedVerse[]).sort((a: SavedVerse, b: SavedVerse) => b.timestamp - a.timestamp);
    const [filter, setFilter] = useState<'all' | 'bookmarks' | 'highlights'>('all');

    const filteredItems = items.filter((item: SavedVerse) => {
      if (filter === 'bookmarks') return item.isBookmarked;
      if (filter === 'highlights') return !!item.highlightColor;
      return true;
    });

    return (
      <div className="p-6 bg-[#fcfaf7] dark:bg-stone-900 min-h-full pb-32">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Saved Content</h2>
          <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${filter === 'all' ? 'bg-white dark:bg-stone-700 text-amber-800 dark:text-amber-400 shadow-sm' : 'text-stone-400'}`}
            >All</button>
            <button 
              onClick={() => setFilter('bookmarks')}
              className={`px-3 py-1 rounded-lg transition-colors ${filter === 'bookmarks' ? 'bg-white dark:bg-stone-700 text-amber-800 dark:text-amber-400 shadow-sm' : 'text-stone-400'}`}
            >Saved</button>
            <button 
              onClick={() => setFilter('highlights')}
              className={`px-3 py-1 rounded-lg transition-colors ${filter === 'highlights' ? 'bg-white dark:bg-stone-700 text-amber-800 dark:text-amber-400 shadow-sm' : 'text-stone-400'}`}
            >Colors</button>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <Bookmark className="mx-auto mb-4 opacity-20" size={48} />
            <p>No saved verses yet.</p>
            <p className="text-xs mt-1">Verses you bookmark or highlight in the Bible will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item: SavedVerse) => (
              <div key={item.key} className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 shadow-sm overflow-hidden p-4 group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {item.isBookmarked && <Bookmark size={14} className="text-amber-600 fill-amber-600 dark:text-amber-400 dark:fill-amber-400" />}
                    {item.highlightColor && (
                      <div className={`w-3 h-3 rounded-full ${
                        item.highlightColor === 'yellow' ? 'bg-yellow-400' :
                        item.highlightColor === 'green' ? 'bg-green-400' :
                        item.highlightColor === 'blue' ? 'bg-blue-400' :
                        item.highlightColor === 'rose' ? 'bg-rose-400' : 'bg-purple-400'
                      }`} />
                    )}
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-widest">
                      {item.bookName} {item.chapter}:{item.verseNumber}
                    </span>
                  </div>
                  <button 
                    onClick={() => removeItem(item.key)}
                    className="text-stone-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm text-stone-700 dark:text-stone-300 serif-bible leading-relaxed mb-3">
                  {item.text}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-stone-300 dark:text-stone-500 uppercase font-medium">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => setActiveTab('bible')}
                    className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase hover:underline"
                  >
                    Read Chapter <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard language={language} onNavigateToBible={() => setActiveTab('bible')} />;
      case 'bible':
        return (
          <BibleReader 
            language={language} 
            fontSize={fontSize} 
            savedItems={savedItems}
            onToggleBookmark={toggleBookmark}
            onUpdateHighlight={updateHighlight}
          />
        );
      case 'prayer':
        return <PrayerJournal />;
      case 'favorites':
        return <FavoritesView />;
      case 'settings':
        return (
          <Settings 
            language={language} 
            setLanguage={setLanguage} 
            fontSize={fontSize} 
            setFontSize={setFontSize} 
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
        );
      default:
        return <Dashboard language={language} onNavigateToBible={() => setActiveTab('bible')} />;
    }
  };

  return (
    <div className={`flex flex-col min-h-screen max-w-md mx-auto bg-white dark:bg-stone-900 shadow-2xl relative transition-colors duration-300`}>
      {/* Top App Bar */}
      <header className="px-6 py-4 flex items-center justify-between bg-white dark:bg-stone-900 z-20 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-amber-200 dark:shadow-none">
            †
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-800 dark:text-stone-100 tracking-tight leading-none">Angelina’s Bible</h1>
            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-widest mt-1">CSI Holy Word</p>
          </div>
        </div>
        <button className="relative p-2 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors">
          <Bell size={22} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-stone-900"></span>
        </button>
      </header>

      {/* Dynamic Body */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {renderContent()}
      </main>

      {/* Fixed Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;

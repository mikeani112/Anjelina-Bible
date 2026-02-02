
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, BookText, Share2, MessageCircle, Loader2, Highlighter, X, RefreshCw, AlertCircle, Bookmark, Layers } from 'lucide-react';
import { BIBLE_BOOKS } from '../constants';
import { Language, Book, Verse, SavedVerse } from '../types';
import { getVerseCommentary, getChapterVerses, getCachedVerses } from '../geminiService';

interface BibleReaderProps {
  language: Language;
  fontSize: number;
  savedItems: Record<string, SavedVerse>;
  onToggleBookmark: (item: Omit<SavedVerse, 'timestamp' | 'isBookmarked'>) => void;
  onUpdateHighlight: (item: Omit<SavedVerse, 'timestamp' | 'isBookmarked'>, color: string | undefined) => void;
}

const HIGHLIGHT_COLORS = [
  { id: 'yellow', class: 'bg-yellow-200 dark:bg-yellow-900/40', dot: 'bg-yellow-400' },
  { id: 'green', class: 'bg-green-200 dark:bg-green-900/40', dot: 'bg-green-400' },
  { id: 'blue', class: 'bg-blue-200 dark:bg-blue-900/40', dot: 'bg-blue-400' },
  { id: 'rose', class: 'bg-rose-200 dark:bg-rose-900/40', dot: 'bg-rose-400' },
  { id: 'purple', class: 'bg-purple-200 dark:bg-purple-900/40', dot: 'bg-purple-400' },
];

const BibleReader: React.FC<BibleReaderProps> = ({ 
  language, 
  fontSize, 
  savedItems, 
  onToggleBookmark, 
  onUpdateHighlight 
}) => {
  const [activeTestament, setActiveTestament] = useState<'Old' | 'New'>('New');
  const [selectedBook, setSelectedBook] = useState<Book>(BIBLE_BOOKS.find(b => b.testament === 'New') || BIBLE_BOOKS[0]);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [commentary, setCommentary] = useState<string | null>(null);
  const [isCommentaryLoading, setIsCommentaryLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentRequestRef = useRef<number>(0);

  // Background Prefetching logic
  const prefetchNext = useCallback(async (book: Book, chapter: number, lang: Language) => {
    let nextBook = book;
    let nextChapter = chapter + 1;

    if (nextChapter > book.chapters) {
      const currentIndex = BIBLE_BOOKS.findIndex(b => b.id === book.id);
      if (currentIndex < BIBLE_BOOKS.length - 1) {
        nextBook = BIBLE_BOOKS[currentIndex + 1];
        nextChapter = 1;
      } else {
        return; // End of Bible
      }
    }

    const nextBookName = lang === Language.TAMIL ? nextBook.nameTa : nextBook.nameEn;
    if (!getCachedVerses(nextBookName, nextChapter, lang)) {
      setTimeout(async () => {
        try {
          await getChapterVerses(nextBookName, nextChapter, lang);
        } catch (e) {
          // Silently fail prefetch
        }
      }, 15000); // 15s delay for prefetch
    }
  }, []);

  const fetchVerses = async () => {
    const requestId = ++currentRequestRef.current;
    const bookName = language === Language.TAMIL ? selectedBook.nameTa : selectedBook.nameEn;
    const cached = getCachedVerses(bookName, currentChapter, language);

    setVerses([]); 
    setError(null);
    setSelectedVerse(null);
    setCommentary(null);

    if (cached) {
      if (requestId === currentRequestRef.current) {
        setVerses(cached);
        setIsLoading(false);
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
        prefetchNext(selectedBook, currentChapter, language);
      }
      return;
    }

    setIsLoading(true);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;

    try {
      const data = await getChapterVerses(bookName, currentChapter, language);
      if (requestId === currentRequestRef.current) {
        if (data && Array.isArray(data) && data.length > 0) {
          setVerses(data);
          setError(null);
          prefetchNext(selectedBook, currentChapter, language);
        } else {
          throw new Error("Could not retrieve verses.");
        }
      }
    } catch (err: any) {
      if (requestId === currentRequestRef.current) {
        console.error("Bible fetch error:", err);
        let userMsg = "The chapter is currently unavailable. Please check your connection or try again.";
        if (err.message?.includes("quota") || err.message?.includes("429")) {
          userMsg = "The server is currently busy. Please wait a few seconds and try again.";
        } else if (err.message?.includes("Empty") || err.message?.includes("generated")) {
          userMsg = "We encountered an issue opening this chapter. Please tap 'Try Again'.";
        }
        setError(userMsg);
      }
    } finally {
      if (requestId === currentRequestRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchVerses();
  }, [selectedBook, currentChapter, language]);

  const handleVerseClick = async (verse: Verse) => {
    setSelectedVerse(verse);
    setIsCommentaryLoading(true);
    setCommentary(null);
    try {
      const result = await getVerseCommentary(`${selectedBook.nameEn} ${currentChapter}:${verse.number}`, verse.text, language);
      setCommentary(result);
    } catch (e) {
      setCommentary("Spiritual reflections are briefly unavailable. May God's peace be with you.");
    } finally {
      setIsCommentaryLoading(false);
    }
  };

  const currentSavedKey = selectedVerse ? `${selectedBook.id}-${currentChapter}-${selectedVerse.number}` : '';
  const isBookmarked = selectedVerse && savedItems[currentSavedKey]?.isBookmarked;

  const handleToggleBookmark = () => {
    if (!selectedVerse) return;
    onToggleBookmark({
      key: currentSavedKey,
      bookId: selectedBook.id,
      bookName: language === Language.TAMIL ? selectedBook.nameTa : selectedBook.nameEn,
      chapter: currentChapter,
      verseNumber: selectedVerse.number,
      text: selectedVerse.text,
      lang: language
    });
  };

  const handleApplyHighlight = (colorId: string | undefined) => {
    if (!selectedVerse) return;
    onUpdateHighlight({
      key: currentSavedKey,
      bookId: selectedBook.id,
      bookName: language === Language.TAMIL ? selectedBook.nameTa : selectedBook.nameEn,
      chapter: currentChapter,
      verseNumber: selectedVerse.number,
      text: selectedVerse.text,
      lang: language
    }, colorId);
  };

  const goToNextChapter = () => {
    if (isLoading) return;
    if (currentChapter < selectedBook.chapters) {
      setCurrentChapter(prev => prev + 1);
    } else {
      const currentIndex = BIBLE_BOOKS.findIndex(b => b.id === selectedBook.id);
      if (currentIndex < BIBLE_BOOKS.length - 1) {
        const nextB = BIBLE_BOOKS[currentIndex + 1];
        setSelectedBook(nextB);
        setActiveTestament(nextB.testament);
        setCurrentChapter(1);
      }
    }
  };

  const goToPrevChapter = () => {
    if (isLoading) return;
    if (currentChapter > 1) {
      setCurrentChapter(prev => prev - 1);
    } else {
      const currentIndex = BIBLE_BOOKS.findIndex(b => b.id === selectedBook.id);
      if (currentIndex > 0) {
        const prevBook = BIBLE_BOOKS[currentIndex - 1];
        setSelectedBook(prevBook);
        setActiveTestament(prevBook.testament);
        setCurrentChapter(prevBook.chapters);
      }
    }
  };

  const getHighlightClass = (verseNumber: number) => {
    const key = `${selectedBook.id}-${currentChapter}-${verseNumber}`;
    const colorId = savedItems[key]?.highlightColor;
    if (!colorId) return '';
    const color = HIGHLIGHT_COLORS.find(c => c.id === colorId);
    return color ? color.class : '';
  };

  const filteredBooks = BIBLE_BOOKS.filter(b => b.testament === activeTestament);

  return (
    <div className="flex flex-col h-full bg-[#fcfaf7] dark:bg-stone-900 transition-colors">
      <div className="sticky top-0 bg-[#fcfaf7]/95 dark:bg-stone-900/95 backdrop-blur-md z-30 p-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl flex-1 max-w-[280px]">
            <button 
              onClick={() => {
                if (activeTestament === 'Old') return;
                setActiveTestament('Old');
                const firstOld = BIBLE_BOOKS.find(b => b.testament === 'Old');
                if (firstOld) {
                  setSelectedBook(firstOld);
                  setCurrentChapter(1);
                }
              }}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${activeTestament === 'Old' ? 'bg-amber-700 text-white shadow-md' : 'text-stone-500 dark:text-stone-400'}`}
            >
              {language === Language.TAMIL ? 'பழைய ஏற்பாடு' : 'Old Testament'}
            </button>
            <button 
              onClick={() => {
                if (activeTestament === 'New') return;
                setActiveTestament('New');
                const firstNew = BIBLE_BOOKS.find(b => b.testament === 'New');
                if (firstNew) {
                  setSelectedBook(firstNew);
                  setCurrentChapter(1);
                }
              }}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${activeTestament === 'New' ? 'bg-amber-700 text-white shadow-md' : 'text-stone-500 dark:text-stone-400'}`}
            >
              {language === Language.TAMIL ? 'புதிய ஏற்பாடு' : 'New Testament'}
            </button>
          </div>
          <button className="p-2 text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
             <Layers size={20} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookText className="text-amber-800 dark:text-amber-400" size={18} />
            <select 
              className="bg-transparent font-bold text-stone-800 dark:text-stone-100 focus:outline-none cursor-pointer max-w-[140px] truncate"
              value={selectedBook.id}
              onChange={(e) => {
                const book = BIBLE_BOOKS.find(b => b.id === e.target.value);
                if (book) {
                  setSelectedBook(book);
                  setCurrentChapter(1);
                }
              }}
            >
              {filteredBooks.map(book => (
                <option key={book.id} value={book.id} className="dark:bg-stone-800">
                  {language === Language.TAMIL ? book.nameTa : book.nameEn}
                </option>
              ))}
            </select>
            <span className="text-stone-300 dark:text-stone-600 font-bold mx-0.5">/</span>
            <select 
              className="bg-transparent font-bold text-stone-800 dark:text-stone-100 focus:outline-none cursor-pointer"
              value={currentChapter}
              onChange={(e) => setCurrentChapter(Number(e.target.value))}
            >
              {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(num => (
                <option key={num} value={num} className="dark:bg-stone-800">{num}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={goToPrevChapter}
              disabled={isLoading}
              className="p-1.5 rounded-full text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={goToNextChapter}
              disabled={isLoading}
              className="p-1.5 rounded-full text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 pb-32 scroll-smooth">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-stone-400">
            <div className="relative mb-6">
               <div className="absolute inset-0 animate-pulse opacity-20 bg-amber-700 rounded-full w-24 h-24"></div>
               <div className="relative z-10 w-16 h-16 bg-amber-50 dark:bg-stone-800 rounded-full flex items-center justify-center">
                 <Loader2 className="animate-spin text-amber-700 dark:text-amber-400" size={32} />
               </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400 opacity-60">Opening the Word...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in slide-in-from-bottom-4">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-2">Notice</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 max-w-xs px-4">{error}</p>
            <button 
              onClick={fetchVerses}
              className="flex items-center gap-2 px-6 py-3 bg-amber-700 text-white rounded-full font-bold shadow-lg hover:bg-amber-800 transition-all active:scale-95"
            >
              <RefreshCw size={18} /> Try Again
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <h1 className="text-3xl serif-bible font-bold text-stone-800 dark:text-stone-100 mb-2 text-center">
              {language === Language.TAMIL ? selectedBook.nameTa : selectedBook.nameEn} {currentChapter}
            </h1>
            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-[0.3em] text-center mb-10 opacity-60">
              {activeTestament === 'Old' 
                ? (language === Language.TAMIL ? 'பழைய ஏற்பாடு' : 'Old Testament')
                : (language === Language.TAMIL ? 'புதிய ஏற்பாடு' : 'New Testament')}
            </p>
            
            <div 
              className="space-y-6 text-stone-800 dark:text-stone-300 serif-bible leading-relaxed text-justify"
              style={{ fontSize: `${fontSize}px` }}
            >
              {verses.map((v, idx) => {
                const highlightClass = getHighlightClass(v.number);
                const isItemBookmarked = savedItems[`${selectedBook.id}-${currentChapter}-${v.number}`]?.isBookmarked;
                return (
                  <p 
                    key={`${v.number}-${idx}`} 
                    onClick={() => handleVerseClick(v)}
                    className={`group cursor-pointer transition-all p-2 rounded-lg relative ${
                      selectedVerse?.number === v.number ? 'ring-2 ring-amber-400 ring-offset-2' : ''
                    } ${highlightClass || 'hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                  >
                    <sup className="font-bold mr-2 text-amber-700 dark:text-amber-500 opacity-70">{v.number}</sup>
                    <span className={v.isRedLetter ? 'text-rose-700 dark:text-rose-400' : ''}>{v.text}</span>
                    {isItemBookmarked && (
                      <Bookmark size={10} className="absolute top-1 right-1 text-amber-600 fill-amber-600 dark:text-amber-400 dark:fill-amber-400" />
                    )}
                  </p>
                );
              })}
            </div>

            <div className="flex justify-between items-center mt-12 pt-6 border-t border-stone-100 dark:border-stone-800">
              <button 
                onClick={goToPrevChapter} 
                className="text-stone-400 dark:text-stone-500 text-sm hover:text-amber-700 dark:hover:text-amber-400 flex items-center gap-1 font-medium transition-colors"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button 
                onClick={goToNextChapter} 
                className="text-stone-400 dark:text-stone-500 text-sm hover:text-amber-700 dark:hover:text-amber-400 flex items-center gap-1 font-medium transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedVerse && (
        <div className="fixed bottom-20 left-4 right-4 bg-white dark:bg-stone-800 shadow-2xl rounded-2xl p-5 border border-amber-100 dark:border-stone-700 z-40 transform animate-in slide-in-from-bottom duration-300 overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-amber-900 dark:text-amber-200">
              {selectedBook.nameEn} {currentChapter}:{selectedVerse.number}
            </h3>
            <button 
              onClick={() => setSelectedVerse(null)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Highlighter size={14} className="text-amber-700 dark:text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Highlight</span>
            </div>
            <div className="flex items-center gap-3">
              {HIGHLIGHT_COLORS.map(color => (
                <button
                  key={color.id}
                  onClick={() => handleApplyHighlight(color.id)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${
                    savedItems[currentSavedKey]?.highlightColor === color.id 
                    ? 'border-stone-800 dark:border-stone-100 scale-110 shadow-sm' 
                    : 'border-transparent'
                  } ${color.dot}`}
                />
              ))}
              <button
                onClick={() => handleApplyHighlight(undefined)}
                className="w-8 h-8 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                title="Clear Highlight"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto pr-2">
            <p className="text-sm text-stone-500 dark:text-stone-400 italic mb-4">"{selectedVerse.text}"</p>
            <div className="border-t dark:border-stone-700 pt-4">
              <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-400">
                <MessageCircle size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">CSI Commentary</span>
              </div>
              {isCommentaryLoading ? (
                <div className="flex flex-col gap-2 animate-pulse">
                  <div className="h-2 w-full bg-stone-100 dark:bg-stone-700 rounded"></div>
                  <div className="h-2 w-2/3 bg-stone-100 dark:bg-stone-700 rounded"></div>
                </div>
              ) : (
                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  {commentary}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-2 border-t border-stone-50 dark:border-stone-750">
             <button 
               onClick={handleToggleBookmark}
               className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                 isBookmarked ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : 'bg-amber-700 text-white hover:bg-amber-800 shadow-md shadow-amber-200 dark:shadow-none'
               }`}
             >
               <Bookmark size={16} className={isBookmarked ? 'fill-amber-800 dark:fill-amber-300' : ''} /> {isBookmarked ? 'Saved' : 'Save Verse'}
             </button>
             <button className="px-4 py-2 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">
               <Share2 size={16} />
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BibleReader;

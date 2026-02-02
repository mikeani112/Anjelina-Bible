
import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Calendar, BookOpen, ChevronRight, PlayCircle, Loader2, Volume2, Square } from 'lucide-react';
import { INITIAL_DEVOTIONAL } from '../constants';
import { Devotional, Language } from '../types';
import { generateDailyDevotion, generateSpeech } from '../geminiService';

interface DashboardProps {
  language: Language;
  onNavigateToBible: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ language, onNavigateToBible }) => {
  const [devotional, setDevotional] = useState<Devotional>(INITIAL_DEVOTIONAL);
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const fetchDevotion = async () => {
      setIsLoading(true);
      try {
        const data = await generateDailyDevotion(language);
        setDevotional(data);
      } catch (e) {
        console.error("Failed to load AI devotion", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDevotion();
  }, [language]);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Source might already be stopped
      }
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleListenAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (isAudioLoading) return;

    setIsAudioLoading(true);
    try {
      const audioBuffer = await generateSpeech(devotional.verseText, language);
      
      // Initialize AudioContext if needed
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const ctx = audioCtxRef.current;
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        audioSourceRef.current = null;
      };

      audioSourceRef.current = source;
      source.start();
      setIsPlaying(true);
    } catch (error) {
      console.error("TTS failed:", error);
      alert("Unable to play audio right now. Please try again later.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return (
    <div className="flex flex-col bg-[#fcfaf7] dark:bg-stone-900 pb-32 transition-colors">
      {/* Hero Section */}
      <div className="bg-amber-900 dark:bg-amber-950 text-white px-6 py-10 rounded-b-[40px] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <BookOpen size={120} />
        </div>
        <div className="relative z-10">
          <p className="text-amber-200 text-xs font-bold uppercase tracking-[0.2em] mb-2">Daily Verse</p>
          <h2 className="text-2xl serif-bible italic leading-tight mb-4">
            "{devotional.verseText}"
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-amber-100">{devotional.verseRef}</span>
            <button 
              onClick={handleListenAudio}
              disabled={isAudioLoading}
              className={`flex items-center gap-2 text-xs backdrop-blur px-4 py-2 rounded-full transition-all ${
                isPlaying 
                ? 'bg-rose-500/80 hover:bg-rose-600/80 text-white' 
                : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {isAudioLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isPlaying ? (
                <>
                  <Square size={16} fill="currentColor" /> Stop
                </>
              ) : (
                <>
                  <Volume2 size={16} /> Listen Audio
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">
        {/* Devotional Card */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-amber-600 dark:text-amber-400" size={20} />
            <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">Daily Devotional</h3>
          </div>
          
          <div className={`bg-white dark:bg-stone-800 rounded-3xl p-6 shadow-sm border border-stone-100 dark:border-stone-700 transition-opacity ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-50 dark:bg-stone-700 p-3 rounded-2xl">
                <Calendar className="text-amber-700 dark:text-amber-400" size={20} />
              </div>
              <div>
                <h4 className="font-bold text-stone-800 dark:text-stone-100">{devotional.title}</h4>
                <p className="text-xs text-stone-400 dark:text-stone-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            
            <p className="text-stone-600 dark:text-stone-300 text-sm leading-relaxed mb-6 italic">
              {devotional.content}
            </p>

            <div className="bg-stone-50 dark:bg-stone-900 p-4 rounded-2xl border-l-4 border-amber-600 dark:border-amber-700">
              <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase mb-1">Today's Prayer</p>
              <p className="text-sm text-stone-700 dark:text-stone-300">{devotional.prayer}</p>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4">Reading Plans</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={onNavigateToBible}
              className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-3xl border border-amber-100 dark:border-amber-900/20 text-left hover:scale-[1.02] transition-transform"
            >
              <div className="bg-white dark:bg-stone-800 w-8 h-8 rounded-full flex items-center justify-center mb-3 shadow-sm">
                <BookOpen size={16} className="text-amber-700 dark:text-amber-400" />
              </div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">CSI One Year</p>
              <p className="text-[10px] text-amber-700/60 dark:text-amber-400/60 uppercase">Day 142 of 365</p>
            </button>
            <button className="bg-stone-100 dark:bg-stone-800 p-4 rounded-3xl border border-stone-200 dark:border-stone-700 text-left hover:scale-[1.02] transition-transform">
              <div className="bg-white dark:bg-stone-700 w-8 h-8 rounded-full flex items-center justify-center mb-3 shadow-sm">
                <Sparkles size={16} className="text-stone-700 dark:text-stone-300" />
              </div>
              <p className="text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">New Testament</p>
              <p className="text-[10px] text-stone-500 dark:text-stone-500 uppercase">90 Day Challenge</p>
            </button>
          </div>
        </section>

        {/* Psalms Section */}
        <button 
          onClick={onNavigateToBible}
          className="w-full flex items-center justify-between p-5 bg-white dark:bg-stone-800 rounded-3xl border border-stone-100 dark:border-stone-700 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-stone-700 rounded-2xl flex items-center justify-center text-amber-800 dark:text-amber-400 font-bold">Ps</div>
            <div className="text-left">
              <p className="font-bold text-stone-800 dark:text-stone-100">Psalms & Prayers</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Ancient songs for the soul</p>
            </div>
          </div>
          <ChevronRight className="text-stone-400" size={20} />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;


import React from 'react';
import { Languages, Type, Moon, Info, Shield, LogOut } from 'lucide-react';
import { Language } from '../types';

interface SettingsProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  isDarkMode: boolean;
  setIsDarkMode: (mode: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  language, 
  setLanguage, 
  fontSize, 
  setFontSize, 
  isDarkMode, 
  setIsDarkMode 
}) => {
  return (
    <div className="p-6 bg-[#fcfaf7] dark:bg-stone-900 min-h-full pb-32 transition-colors">
      <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-8">Settings</h2>

      <div className="space-y-6">
        {/* Language Section */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
            <Languages size={14} /> Language Preference
          </label>
          <div className="flex bg-white dark:bg-stone-800 p-1 rounded-2xl border border-stone-100 dark:border-stone-700 shadow-sm">
            <button 
              onClick={() => setLanguage(Language.ENGLISH)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                language === Language.ENGLISH ? 'bg-amber-700 text-white shadow-md' : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              English
            </button>
            <button 
              onClick={() => setLanguage(Language.TAMIL)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                language === Language.TAMIL ? 'bg-amber-700 text-white shadow-md' : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              தமிழ் (Tamil)
            </button>
          </div>
        </div>

        {/* Font Size Section */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
            <Type size={14} /> Bible Font Size
          </label>
          <div className="bg-white dark:bg-stone-800 p-6 rounded-2xl border border-stone-100 dark:border-stone-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-stone-400 text-sm italic">A</span>
              <span className="text-stone-800 dark:text-stone-100 text-xl font-bold italic">A</span>
            </div>
            <input 
              type="range" 
              min="14" 
              max="32" 
              step="2"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-700"
            />
            <p className="text-center text-xs text-stone-400 mt-2">Current size: {fontSize}px</p>
          </div>
        </div>

        {/* App Appearance */}
        <div className="space-y-2">
           <label className="text-xs font-bold uppercase tracking-widest text-stone-400">General</label>
           <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 shadow-sm divide-y dark:divide-stone-700">
             <div className="p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <Moon size={20} className="text-stone-600 dark:text-stone-400" />
                 <span className="text-stone-700 dark:text-stone-300 font-medium">Dark Mode</span>
               </div>
               <button 
                 onClick={() => setIsDarkMode(!isDarkMode)}
                 className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${isDarkMode ? 'bg-amber-700' : 'bg-stone-200 dark:bg-stone-700'}`}
               >
                 <div className={`absolute top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`}></div>
               </button>
             </div>
             <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors">
               <div className="flex items-center gap-3">
                 <Shield size={20} className="text-stone-600 dark:text-stone-400" />
                 <span className="text-stone-700 dark:text-stone-300 font-medium">Privacy Policy</span>
               </div>
             </div>
             <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors">
               <div className="flex items-center gap-3">
                 <Info size={20} className="text-stone-600 dark:text-stone-400" />
                 <span className="text-stone-700 dark:text-stone-300 font-medium">About Angelina’s Bible</span>
               </div>
             </div>
           </div>
        </div>

        {/* Profile */}
        <div className="pt-6">
          <button className="w-full p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors">
            <LogOut size={20} />
            Sign Out
          </button>
          <p className="text-center text-[10px] text-stone-300 dark:text-stone-600 mt-6 uppercase tracking-[0.3em]">Version 1.0.4 • CSI 2024</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;


import React from 'react';
import { Home, BookOpen, Heart, Settings, MessageSquare } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'bible', icon: BookOpen, label: 'Bible' },
    { id: 'prayer', icon: MessageSquare, label: 'Prayer' },
    { id: 'favorites', icon: Heart, label: 'Saved' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 px-4 py-2 flex justify-around items-center z-50 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)] transition-colors">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              isActive ? 'text-amber-700 dark:text-amber-400' : 'text-stone-400 dark:text-stone-600'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;

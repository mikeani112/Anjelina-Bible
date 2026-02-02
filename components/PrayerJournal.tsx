
import React, { useState } from 'react';
import { Plus, CheckCircle, Circle, Trash2, Heart } from 'lucide-react';
import { PrayerRequest } from '../types';

const PrayerJournal: React.FC = () => {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([
    { id: '1', title: 'Health for Grandmother', content: 'Pray for a speedy recovery after surgery.', isAnswered: false, timestamp: Date.now() },
    { id: '2', title: 'Church Growth', content: 'Blessing for the new youth outreach program.', isAnswered: true, timestamp: Date.now() - 86400000 },
  ]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const addPrayer = () => {
    if (!newTitle.trim()) return;
    const prayer: PrayerRequest = {
      id: Date.now().toString(),
      title: newTitle,
      content: newContent,
      isAnswered: false,
      timestamp: Date.now(),
    };
    setPrayers([prayer, ...prayers]);
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  const toggleAnswered = (id: string) => {
    setPrayers(prayers.map(p => p.id === id ? { ...p, isAnswered: !p.isAnswered } : p));
  };

  const deletePrayer = (id: string) => {
    setPrayers(prayers.filter(p => p.id !== id));
  };

  return (
    <div className="p-6 bg-[#fcfaf7] dark:bg-stone-900 min-h-full pb-32 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
          <Heart className="text-rose-500 fill-rose-500" size={24} />
          Prayer Journal
        </h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-amber-700 text-white rounded-full shadow-lg hover:bg-amber-800 transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-stone-800 p-4 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 mb-6 space-y-3">
          <input 
            type="text" 
            placeholder="Prayer Title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full p-2 border-b border-stone-100 dark:border-stone-700 bg-transparent dark:text-stone-100 focus:outline-none focus:border-amber-500 font-semibold"
          />
          <textarea 
            placeholder="Details (optional)..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full p-2 text-sm text-stone-600 dark:text-stone-400 bg-transparent focus:outline-none min-h-[80px]"
          />
          <div className="flex gap-2">
            <button 
              onClick={addPrayer}
              className="flex-1 py-2 bg-amber-700 text-white rounded-lg font-medium shadow-md shadow-amber-200 dark:shadow-none hover:bg-amber-800 transition-colors"
            >
              Add Request
            </button>
            <button 
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-stone-400 dark:text-stone-500 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {prayers.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <p>Your prayer list is empty.</p>
            <p className="text-sm">Tap the + to add a request.</p>
          </div>
        )}
        {prayers.map(prayer => (
          <div 
            key={prayer.id}
            className={`p-4 rounded-xl border transition-all ${
              prayer.isAnswered 
              ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20 opacity-75' 
              : 'bg-white dark:bg-stone-800 border-stone-100 dark:border-stone-700 shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3">
              <button 
                onClick={() => toggleAnswered(prayer.id)}
                className={`mt-1 transition-colors ${prayer.isAnswered ? 'text-green-600 dark:text-green-500' : 'text-stone-300 dark:text-stone-600'}`}
              >
                {prayer.isAnswered ? <CheckCircle size={22} /> : <Circle size={22} />}
              </button>
              <div className="flex-1">
                <h3 className={`font-semibold ${prayer.isAnswered ? 'line-through text-stone-500 dark:text-stone-500' : 'text-stone-800 dark:text-stone-100'}`}>
                  {prayer.title}
                </h3>
                {prayer.content && (
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{prayer.content}</p>
                )}
                <p className="text-[10px] text-stone-400 dark:text-stone-600 mt-2 uppercase tracking-widest font-bold">
                  {new Date(prayer.timestamp).toLocaleDateString()}
                </p>
              </div>
              <button 
                onClick={() => deletePrayer(prayer.id)}
                className="text-stone-300 dark:text-stone-600 hover:text-rose-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrayerJournal;

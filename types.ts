
export enum Language {
  ENGLISH = 'en',
  TAMIL = 'ta'
}

export interface Verse {
  number: number;
  text: string;
  isRedLetter?: boolean;
}

export interface Chapter {
  number: number;
  verses: Verse[];
}

export interface Book {
  id: string;
  nameEn: string;
  nameTa: string;
  testament: 'Old' | 'New';
  chapters: number;
}

export interface SavedVerse {
  key: string; // bookId-chapter-verse
  bookId: string;
  bookName: string;
  chapter: number;
  verseNumber: number;
  text: string;
  lang: Language;
  timestamp: number;
  highlightColor?: string;
  isBookmarked: boolean;
}

export interface Note {
  id: string;
  bookId: string;
  chapter: number;
  verse: number;
  content: string;
  timestamp: number;
}

export interface PrayerRequest {
  id: string;
  title: string;
  content: string;
  isAnswered: boolean;
  timestamp: number;
}

export interface Devotional {
  date: string;
  verseRef: string;
  verseText: string;
  title: string;
  content: string;
  prayer: string;
}

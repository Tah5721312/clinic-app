'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  User,
  Stethoscope,
  Calendar,
  Receipt,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { DOMAIN } from '@/lib/constants';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  type: 'patient' | 'doctor' | 'appointment' | 'invoice';
  id: number;
  title: string;
  subtitle: string;
  description?: string;
  href: string;
  relevance: number;
}

interface GlobalSearchProps {
  onClose?: () => void;
}

const typeIcons = {
  patient: User,
  doctor: Stethoscope,
  appointment: Calendar,
  invoice: Receipt,
};

const typeLabels = {
  patient: 'Patient',
  doctor: 'Doctor',
  appointment: 'Appointment',
  invoice: 'Invoice',
};

const typeColors = {
  patient: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  doctor: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  appointment: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  invoice: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
};

export default function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Perform search
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${DOMAIN}/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`
        );

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        setResults(data.results || []);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!results.length && e.key !== 'Escape') return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
      }
    },
    [results, selectedIndex]
  );

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    router.push(result.href);
    handleClose();
  };

  // Handle close
  const handleClose = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    if (onClose) onClose();
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);


  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        if (query === '') {
          handleClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, query]);

  return (
    <div className="relative">
      {/* Search Button/Input */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(true)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg 
            bg-blue-50 dark:bg-dark-700 text-blue-700 dark:text-blue-300
            hover:bg-blue-100 dark:hover:bg-dark-600
            transition-all duration-200
            border border-blue-200 dark:border-dark-600
            ${isOpen ? 'hidden' : 'flex'}
          `}
          aria-label="Global Search"
        >
          <Search className="w-4 h-4" />
          <span className="hidden md:inline text-sm font-medium">
            Search...
          </span>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-0 md:relative md:top-auto md:right-auto z-[100]">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none z-10" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search doctors,patients,appointments,invoices..."
                className={`
                  w-[280px] md:w-76 pl-10 pr-10 py-2 h-10 md:py-2.5
                  rounded-lg border border-blue-300 dark:border-blue-600
                  bg-white dark:bg-dark-700
                  text-gray-900 dark:text-gray-300
                  text-sm md:text-base
                  placeholder-gray-400 dark:placeholder-blue-300
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  focus:border-blue-500 dark:focus:border-blue-400
                  shadow-lg
                `}
              />
              <button
                onClick={handleClose}
                className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Dropdown */}
            {query.length >= 2 && (
              <div
                ref={resultsRef}
                className={`
                  absolute top-full mt-2 w-[280px] md:w-96
                  bg-white dark:bg-dark-800
                  border border-gray-200 dark:border-dark-600
                  rounded-lg shadow-xl
                  max-h-[60vh] md:max-h-96 overflow-y-auto
                  z-[100]
                  right-0 md:right-auto
                `}
              >
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : results.length > 0 ? (
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-dark-600">
                      {results.length} result{results.length !== 1 ? 's' : ''} found
                    </div>
                    {results.map((result, index) => {
                      const Icon = typeIcons[result.type];
                      const isSelected = index === selectedIndex;

                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className={`
                            w-full text-left p-3 rounded-lg
                            transition-colors duration-150
                            ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-900/30'
                                : 'hover:bg-gray-50 dark:hover:bg-dark-700'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`
                                p-2 rounded-lg flex-shrink-0
                                ${typeColors[result.type]}
                              `}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {result.title}
                                </span>
                                <span
                                  className={`
                                    text-xs px-2 py-0.5 rounded
                                    ${typeColors[result.type]}
                                  `}
                                >
                                  {typeLabels[result.type]}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {result.subtitle}
                              </p>
                              {result.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  {result.description}
                                </p>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No results found</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}


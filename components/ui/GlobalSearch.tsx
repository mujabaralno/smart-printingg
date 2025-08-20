"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, FileText, Users, Building2, ArrowRight, Clock, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { searchService, SearchResult } from "@/lib/search-service";
import { useRouter } from "next/navigation";

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
}

export default function GlobalSearch({ 
  className = "", 
  placeholder = "Search quotes, clients, suppliers..." 
}: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveToHistory = (query: string) => {
    if (!query.trim()) return;
    
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showResults) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          } else if (query.trim()) {
            performSearch(query);
          }
          break;
        case 'Escape':
          setShowResults(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showResults, results, selectedIndex, query]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global search shortcut: Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // Quick search shortcut: /
      if (e.key === '/' && !isFocused && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      if (e.key === 'Escape' && isFocused) {
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const searchResults = searchService.search({ query: searchQuery, limit: 10 });
      setResults(searchResults);
      setShowResults(true);
      setSelectedIndex(-1);
      
      // Log search analytics (in a real app, this would go to analytics service)
      console.log(`Search performed: "${searchQuery}" - Found ${searchResults.length} results`);
      
      // Track search patterns for better UX
      const searchAnalytics = {
        query: searchQuery,
        resultsCount: searchResults.length,
        timestamp: new Date().toISOString(),
        resultTypes: searchResults.map(r => r.type)
      };
      
      // Store in localStorage for demo purposes (in real app, send to analytics)
      const existingAnalytics = JSON.parse(localStorage.getItem('searchAnalytics') || '[]');
      existingAnalytics.push(searchAnalytics);
      localStorage.setItem('searchAnalytics', JSON.stringify(existingAnalytics.slice(-100))); // Keep last 100
      
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    saveToHistory(query);
    setShowResults(false);
    setQuery("");
    router.push(result.url);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query);
      saveToHistory(query);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quote': return <FileText className="w-4 h-4" />;
      case 'client': return <Users className="w-4 h-4" />;
      case 'material': return <Building2 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quote': return 'text-blue-600 bg-blue-50';
      case 'client': return 'text-green-600 bg-green-50';
      case 'material': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (description: string) => {
    if (description.includes('Approved')) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (description.includes('Pending')) return <Clock className="w-4 h-4 text-yellow-600" />;
    if (description.includes('Rejected')) return <XCircle className="w-4 h-4 text-red-600" />;
    return null;
  };

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (query.trim() && results.length > 0) {
                setShowResults(true);
              }
            }}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "w-80 pl-10 pr-10 py-2.5 bg-gray-50 border-gray-200 text-gray-900 rounded-xl transition-all duration-200",
              "focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
              "hover:bg-gray-100 hover:border-gray-300 placeholder:text-gray-500 placeholder:text-sm",
              query.trim() && "border-purple-300 bg-purple-50/30"
            )}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 
                         hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {/* Results Header with Counts */}
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 font-medium">
                    Found {results.length} result{results.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    {['quote', 'client', 'material'].map(type => {
                      const count = results.filter(r => r.type === type).length;
                      if (count === 0) return null;
                      return (
                        <span key={type} className="flex items-center space-x-1">
                          {getTypeIcon(type)}
                          <span>{count}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Search Results */}
              <div className="space-y-1">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-50",
                      selectedIndex === index && "bg-purple-50 border border-purple-200"
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Type Icon */}
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        getTypeColor(result.type)
                      )}>
                        {getTypeIcon(result.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {result.title}
                          </h4>
                          {getStatusIcon(result.description)}
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{result.subtitle}</p>
                        <p className="text-xs text-gray-500 truncate">{result.description}</p>
                      </div>
                      
                      {/* Arrow */}
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : query.trim() ? (
            <div className="p-4 text-center text-gray-500">
              <div className="text-sm mb-2">No results found for "{query}"</div>
              <div className="text-xs text-gray-400">Try different keywords or check spelling</div>
            </div>
          ) : null}
          
          {/* Search History */}
          {!query.trim() && searchHistory.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="px-3 py-2 text-xs text-gray-500 font-medium mb-2">Recent Searches</div>
              <div className="space-y-1">
                {searchHistory.slice(0, 5).map((historyItem, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(historyItem)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="truncate">{historyItem}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

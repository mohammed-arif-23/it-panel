'use client'

import { useState } from 'react'
import { ArrowLeft, Search, Filter, SortAsc, SortDesc, Grid, List, RefreshCw } from 'lucide-react'
import { Button } from './button'

interface NavbarProps {
  title: string
  onBack?: () => void
  showSearch?: boolean
  showFilter?: boolean
  showSort?: boolean
  showViewToggle?: boolean
  showRefresh?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  onFilterClick?: () => void
  sortOrder?: 'asc' | 'desc'
  onSortToggle?: () => void
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
  onRefresh?: () => void
  isRefreshing?: boolean
  className?: string
}

export function Navbar({
  title,
  onBack,
  showSearch = false,
  showFilter = false,
  showSort = false,
  showViewToggle = false,
  showRefresh = false,
  searchValue = '',
  onSearchChange,
  onFilterClick,
  sortOrder = 'asc',
  onSortToggle,
  viewMode = 'grid',
  onViewModeChange,
  onRefresh,
  isRefreshing = false,
  className = ''
}: NavbarProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

  return (
    <div className={`bg-white border-b border-gray-200 sticky top-0 z-50 ${className}`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Button>
            )}
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </h1>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            {showSearch && (
              <div className="flex items-center">
                {isSearchExpanded ? (
                  <div className="flex items-center space-x-2 animate-in slide-in-from-right-2">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchValue}
                      onChange={(e) => onSearchChange?.(e.target.value)}
                      className="w-48 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSearchExpanded(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ArrowLeft className="w-4 h-4 text-gray-600" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSearchExpanded(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Search className="w-5 h-5 text-gray-600" />
                  </Button>
                )}
              </div>
            )}

            {/* Filter */}
            {showFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onFilterClick}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Filter className="w-5 h-5 text-gray-600" />
              </Button>
            )}

            {/* Sort */}
            {showSort && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSortToggle}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-5 h-5 text-gray-600" />
                ) : (
                  <SortDesc className="w-5 h-5 text-gray-600" />
                )}
              </Button>
            )}

            {/* Refresh */}
            {showRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}

            {/* View Toggle */}
            {showViewToggle && (
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewModeChange?.('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewModeChange?.('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Expanded Search Bar (Mobile) */}
        {showSearch && isSearchExpanded && (
          <div className="mt-3 md:hidden">
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>
    </div>
  )
}

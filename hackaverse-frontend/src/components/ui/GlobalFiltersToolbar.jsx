import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

const GlobalFiltersToolbar = ({ 
  searchPlaceholder = "Search...",
  trackOptions = [],
  statusOptions = [],
  sortOptions = [],
  onFiltersChange,
  loading = false,
  allowMultiTrack = false
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');
  const [selectedTracks, setSelectedTracks] = useState(
    searchParams.get('track')?.split(',').filter(Boolean) || []
  );
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || sortOptions[0]?.value || '');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  // Load sort preference from localStorage
  useEffect(() => {
    const page = window.location.pathname.split('/').pop();
    const savedSort = localStorage.getItem(`sort-${page}`);
    if (savedSort && !searchParams.get('sort')) {
      setSelectedSort(savedSort);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search effect - searchParams used internally but state is managed separately
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      const page = window.location.pathname.split('/').pop();
      const params = new URLSearchParams();
      if (searchValue) params.set('q', searchValue);
      if (selectedTracks.length > 0) params.set('track', selectedTracks.join(','));
      if (selectedStatus) params.set('status', selectedStatus);
      if (selectedSort) { 
        params.set('sort', selectedSort); 
        localStorage.setItem(`sort-${page}`, selectedSort); 
      }
      setSearchParams(params);
      onFiltersChange?.({ search: searchValue, tracks: selectedTracks, status: selectedStatus, sort: selectedSort });
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchValue, selectedTracks, selectedStatus, selectedSort, setSearchParams, onFiltersChange]);

  // Check for changes
  useEffect(() => {
    const initialSearch = searchParams.get('q') || '';
    const initialTracks = searchParams.get('track')?.split(',').filter(Boolean) || [];
    const initialStatus = searchParams.get('status') || '';
    const initialSort = searchParams.get('sort') || sortOptions[0]?.value || '';

    const changed =
      searchValue !== initialSearch ||
      JSON.stringify(selectedTracks) !== JSON.stringify(initialTracks) ||
      selectedStatus !== initialStatus ||
      selectedSort !== initialSort;

    setHasChanges(changed);
  }, [searchValue, selectedTracks, selectedStatus, selectedSort, sortOptions, searchParams]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && 
          document.activeElement.tagName !== 'INPUT' && 
          document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchValue('');
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updateURL = () => {
    const params = new URLSearchParams(searchParams);
    
    if (searchValue) {
      params.set('q', searchValue);
    } else {
      params.delete('q');
    }
    
    if (selectedTracks.length > 0) {
      params.set('track', selectedTracks.join(','));
    } else {
      params.delete('track');
    }
    
    if (selectedStatus) {
      params.set('status', selectedStatus);
    } else {
      params.delete('status');
    }
    
    if (selectedSort) {
      params.set('sort', selectedSort);
      // Save to localStorage
      const page = window.location.pathname.split('/').pop();
      localStorage.setItem(`sort-${page}`, selectedSort);
    } else {
      params.delete('sort');
    }

    setSearchParams(params);
    
    // Notify parent
    onFiltersChange?.({
      search: searchValue,
      tracks: selectedTracks,
      status: selectedStatus,
      sort: selectedSort
    });
  };

  const handleTrackChange = (value) => {
    if (allowMultiTrack) {
      setSelectedTracks(prev => 
        prev.includes(value) 
          ? prev.filter(t => t !== value)
          : [...prev, value]
      );
    } else {
      setSelectedTracks(value ? [value] : []);
    }
  };

  const removeTrackChip = (track) => {
    setSelectedTracks(prev => prev.filter(t => t !== track));
  };

  const handleReset = () => {
    setSearchValue('');
    setSelectedTracks([]);
    setSelectedStatus('');
    setSelectedSort(sortOptions[0]?.value || '');
    searchInputRef.current?.focus();
  };

  const handleApply = () => {
    updateURL();
    setIsFilterSheetOpen(false);
  };

  if (loading) {
    return (
      <div className="filters-toolbar-skeleton" role="toolbar" aria-label="Filters loading">
        <div className="filters-toolbar-skeleton-search"></div>
        <div className="filters-toolbar-skeleton-select"></div>
        <div className="filters-toolbar-skeleton-select"></div>
        <div className="filters-toolbar-skeleton-select"></div>
        <div className="filters-toolbar-skeleton-chip"></div>
        <div className="filters-toolbar-skeleton-chip"></div>
      </div>
    );
  }

  return (
    <>
      <div className="filters-toolbar glass-card" role="toolbar" aria-label="Filters">
        {/* Search */}
        <div className="filters-toolbar-search">
          <i className="uil uil-search filters-toolbar-search-icon"></i>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            role="combobox"
            aria-expanded="false"
            aria-label="Search"
          />
        </div>

        {/* Desktop Filters */}
        <div className="filters-toolbar-selects">
          {/* Track Filter */}
          {trackOptions.length > 0 && (
            <select
              className="filters-toolbar-select"
              value={allowMultiTrack ? '' : selectedTracks[0] || ''}
              onChange={(e) => handleTrackChange(e.target.value)}
              aria-label="Filter by track"
              aria-haspopup="listbox"
            >
              <option value="">All Tracks</option>
              {trackOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          {statusOptions.length > 0 && (
            <select
              className="filters-toolbar-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by status"
              aria-haspopup="listbox"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {/* Sort */}
          {sortOptions.length > 0 && (
            <select
              className="filters-toolbar-select"
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              aria-label="Sort by"
              aria-haspopup="listbox"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Track Chips */}
        {selectedTracks.length > 0 && (
          <div className="filters-toolbar-chips">
            {selectedTracks.slice(0, 2).map(track => (
              <div key={track} className="filters-toolbar-chip">
                {trackOptions.find(t => t.value === track)?.label || track}
                <button
                  className="filters-toolbar-chip-remove"
                  onClick={() => removeTrackChip(track)}
                  aria-label={`Remove ${track} filter`}
                >
                  ×
                </button>
              </div>
            ))}
            {selectedTracks.length > 2 && (
              <div className="filters-toolbar-chip">
                +{selectedTracks.length - 2}
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="filters-toolbar-divider"></div>

        {/* Actions */}
        <div className="filters-toolbar-actions">
          <button
            className="filters-toolbar-reset"
            onClick={handleReset}
            aria-label="Reset filters"
          >
            Reset
          </button>
          <button
            className="filters-toolbar-apply"
            onClick={handleApply}
            disabled={!hasChanges}
            aria-label="Apply filters"
          >
            Apply
          </button>
        </div>

        {/* Mobile Filter Button */}
        <button
          className="filters-toolbar-mobile-button"
          onClick={() => setIsFilterSheetOpen(true)}
          aria-label="Open filters"
        >
          <i className="uil uil-filter"></i>
          Filter
        </button>
      </div>

      {/* Mobile Filter Sheet */}
      {isFilterSheetOpen && (
        <>
          <div 
            className={`filter-sheet-backdrop ${isFilterSheetOpen ? 'open' : ''}`}
            onClick={() => setIsFilterSheetOpen(false)}
          ></div>
          <div className={`filter-sheet glass-card ${isFilterSheetOpen ? 'open' : ''}`}>
            <div className="filter-sheet-header">
              <h3 className="filter-sheet-title">Filters</h3>
              <button
                className="filter-sheet-close"
                onClick={() => setIsFilterSheetOpen(false)}
                aria-label="Close filters"
              >
                ×
              </button>
            </div>
            
            <div className="filter-sheet-body">
              {trackOptions.length > 0 && (
                <div className="filter-sheet-group">
                  <label className="filter-sheet-label">Track</label>
                  <select
                    className="filters-toolbar-select"
                    value={selectedTracks[0] || ''}
                    onChange={(e) => handleTrackChange(e.target.value)}
                  >
                    <option value="">All Tracks</option>
                    {trackOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {statusOptions.length > 0 && (
                <div className="filter-sheet-group">
                  <label className="filter-sheet-label">Status</label>
                  <select
                    className="filters-toolbar-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {sortOptions.length > 0 && (
                <div className="filter-sheet-group">
                  <label className="filter-sheet-label">Sort</label>
                  <select
                    className="filters-toolbar-select"
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value)}
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="filter-sheet-actions">
              <button className="filters-toolbar-reset" onClick={handleReset}>
                Reset
              </button>
              <button className="filters-toolbar-apply" onClick={handleApply}>
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default GlobalFiltersToolbar;
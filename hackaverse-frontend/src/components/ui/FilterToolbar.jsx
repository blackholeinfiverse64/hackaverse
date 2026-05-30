import React, { useState, useRef, useEffect } from 'react';

const FilterToolbar = ({
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  filters = [],
  onReset,
  onApply,
  hasChanges = false,
  className = ""
}) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);

  // Focus search on "/" key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        onSearchChange('');
        searchRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSearchChange]);

  const MultiSelectChips = ({ filter }) => {
    const selectedValues = Array.isArray(filter.value) ? filter.value : [];
    const displayChips = selectedValues.slice(0, 2);
    const remainingCount = selectedValues.length - 2;

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {displayChips.map((value, idx) => (
          <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-cyan/20 text-cyan text-xs rounded-lg">
            {filter.options.find(opt => opt.value === value)?.label || value}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newValues = selectedValues.filter(v => v !== value);
                filter.onChange(newValues);
              }}
              className="hover:text-white"
            >
              <i className="uil uil-times text-xs"></i>
            </button>
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="px-2 py-1 bg-white/10 text-text-muted text-xs rounded-lg">
            +{remainingCount}
          </span>
        )}
      </div>
    );
  };

  const SelectDropdown = ({ filter }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isMultiSelect = filter.multiple;
    const selectedValues = isMultiSelect ? (Array.isArray(filter.value) ? filter.value : []) : [filter.value];

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="filter-select w-full h-full flex items-center justify-between px-3 text-left"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="flex-1 truncate">
            {isMultiSelect && selectedValues.length > 0 ? (
              <MultiSelectChips filter={filter} />
            ) : (
              <span className={selectedValues[0] ? 'text-white' : 'text-text-muted'}>
                {selectedValues[0] ? 
                  filter.options.find(opt => opt.value === selectedValues[0])?.label || selectedValues[0] :
                  filter.placeholder
                }
              </span>
            )}
          </span>
          <i className={`uil uil-angle-down text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card glass-card border border-white/20 rounded-xl shadow-xl z-50 min-w-[220px] max-h-64 overflow-y-auto">
            {filter.options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    if (isMultiSelect) {
                      const newValues = isSelected 
                        ? selectedValues.filter(v => v !== option.value)
                        : [...selectedValues, option.value];
                      filter.onChange(newValues);
                    } else {
                      filter.onChange(option.value);
                      setIsOpen(false);
                    }
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-center justify-between transition-colors"
                >
                  <span className={isSelected ? 'text-white' : 'text-text-secondary'}>
                    {option.label}
                  </span>
                  {isSelected && (
                    <i className="uil uil-check text-cyan"></i>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {isOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  };

  return (
    <div 
      role="toolbar" 
      aria-label="Filters"
      className={`bg-white/[0.03] border border-white/10 rounded-xl p-3 glass-card ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <div className={`relative flex items-center transition-all ${searchFocused ? 'ring-2 ring-cyan/50' : ''} rounded-xl`}>
            <i className="uil uil-search absolute left-3 text-text-muted"></i>
            <input
              ref={searchRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full h-11 pl-10 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-cyan/50 transition-colors"
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 text-text-muted hover:text-white transition-colors"
              >
                <i className="uil uil-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {filters.map((filter, idx) => (
          <div key={idx} className="w-40 h-11">
            <SelectDropdown filter={filter} />
          </div>
        ))}

        {/* Divider */}
        {filters.length > 0 && (
          <div className="hidden sm:block w-px h-6 bg-white/20"></div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="h-11 px-4 text-sm text-text-muted hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onApply}
            disabled={!hasChanges}
            className="h-11 px-6 text-sm bg-cyan hover:bg-cyan-light disabled:bg-white/10 disabled:text-text-muted text-black font-medium rounded-xl transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterToolbar;
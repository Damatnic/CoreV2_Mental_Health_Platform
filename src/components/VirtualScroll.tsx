/**
 * VirtualScroll Component
 * High-performance virtual scrolling for long lists
 * Implements windowing technique to render only visible items
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { throttle, debounce } from '../utils/performance';
import './VirtualScroll.css';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  containerHeight?: number;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  className?: string;
  itemClassName?: string;
  placeholder?: React.ReactNode;
  loadingMore?: boolean;
  estimatedItemHeight?: number;
  cacheKey?: string;
  enableKeyboardNavigation?: boolean;
}

interface ScrollState {
  scrollTop: number;
  isScrolling: boolean;
}

interface ItemPosition {
  index: number;
  top: number;
  height: number;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight = 600,
  overscan = 3,
  onScroll,
  onEndReached,
  endReachedThreshold = 100,
  className = '',
  itemClassName = '',
  placeholder,
  loadingMore = false,
  estimatedItemHeight = 50,
  cacheKey,
  enableKeyboardNavigation = false,
}: VirtualScrollProps<T>) {
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollTop: 0,
    isScrolling: false,
  });

  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    end: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const itemPositionsRef = useRef<Map<number, ItemPosition>>(new Map());
  const lastMeasuredIndexRef = useRef(-1);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Calculate item heights
  const getItemHeight = useCallback(
    (index: number): number => {
      if (typeof itemHeight === 'function') {
        return itemHeight(index);
      }
      return itemHeight;
    },
    [itemHeight]
  );

  // Get cached item position or calculate
  const getItemPosition = useCallback(
    (index: number): ItemPosition => {
      const cached = itemPositionsRef.current.get(index);
      if (cached) return cached;

      let top = 0;
      for (let i = 0; i < index; i++) {
        const cachedPos = itemPositionsRef.current.get(i);
        if (cachedPos) {
          top = cachedPos.top + cachedPos.height;
        } else {
          top += getItemHeight(i);
        }
      }

      const position = {
        index,
        top,
        height: getItemHeight(index),
      };

      itemPositionsRef.current.set(index, position);
      return position;
    },
    [getItemHeight]
  );

  // Calculate total height
  const totalHeight = useMemo(() => {
    if (items.length === 0) return 0;

    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += getItemHeight(i);
    }
    return height;
  }, [items.length, getItemHeight]);

  // Calculate visible range
  const calculateVisibleRange = useCallback(() => {
    const { scrollTop } = scrollState;
    
    // Binary search for start index
    let start = 0;
    let end = items.length - 1;
    
    while (start < end) {
      const mid = Math.floor((start + end) / 2);
      const position = getItemPosition(mid);
      
      if (position.top < scrollTop) {
        start = mid + 1;
      } else {
        end = mid;
      }
    }
    
    // Adjust for overscan
    start = Math.max(0, start - overscan);
    
    // Calculate end index
    let visibleEnd = start;
    let accumulatedHeight = 0;
    
    while (visibleEnd < items.length && accumulatedHeight < containerHeight + scrollTop) {
      const position = getItemPosition(visibleEnd);
      accumulatedHeight = position.top + position.height;
      visibleEnd++;
    }
    
    // Adjust for overscan
    visibleEnd = Math.min(items.length - 1, visibleEnd + overscan);
    
    return { start, end: visibleEnd };
  }, [scrollState.scrollTop, items.length, containerHeight, overscan, getItemPosition]);

  // Update visible range when scroll or items change
  useEffect(() => {
    const range = calculateVisibleRange();
    setVisibleRange(range);
  }, [calculateVisibleRange]);

  // Handle scroll event
  const handleScroll = useCallback(
    throttle((e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const scrollTop = target.scrollTop;
      
      setScrollState(prev => ({
        ...prev,
        scrollTop,
        isScrolling: true,
      }));
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set scrolling to false after delay
      scrollTimeoutRef.current = setTimeout(() => {
        setScrollState(prev => ({
          ...prev,
          isScrolling: false,
        }));
      }, 150);
      
      // Call onScroll callback
      if (onScroll) {
        onScroll(scrollTop);
      }
      
      // Check if end reached
      if (onEndReached && !loadingMore) {
        const distanceToEnd = totalHeight - (scrollTop + containerHeight);
        if (distanceToEnd < endReachedThreshold) {
          onEndReached();
        }
      }
    }, 16), // ~60fps
    [totalHeight, containerHeight, endReachedThreshold, onScroll, onEndReached, loadingMore]
  );

  // Measure item heights for dynamic sizing
  const measureItem = useCallback((element: HTMLElement | null, index: number) => {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const currentPosition = itemPositionsRef.current.get(index);
    
    if (!currentPosition || currentPosition.height !== rect.height) {
      // Update position cache
      const position = getItemPosition(index);
      position.height = rect.height;
      itemPositionsRef.current.set(index, position);
      
      // Update positions of subsequent items
      for (let i = index + 1; i <= lastMeasuredIndexRef.current; i++) {
        const pos = itemPositionsRef.current.get(i);
        if (pos) {
          pos.top = getItemPosition(i - 1).top + getItemPosition(i - 1).height;
        }
      }
      
      lastMeasuredIndexRef.current = Math.max(lastMeasuredIndexRef.current, index);
    }
  }, [getItemPosition]);

  // Setup ResizeObserver for dynamic heights
  useEffect(() => {
    if (typeof itemHeight === 'function') {
      resizeObserverRef.current = new ResizeObserver(entries => {
        entries.forEach(entry => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          measureItem(entry.target as HTMLElement, index);
        });
      });
    }
    
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [itemHeight, measureItem]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enableKeyboardNavigation || !containerRef.current) return;
    
    const container = containerRef.current;
    const currentScroll = container.scrollTop;
    let newScroll = currentScroll;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newScroll = Math.max(0, currentScroll - getItemHeight(0));
        break;
      case 'ArrowDown':
        e.preventDefault();
        newScroll = Math.min(totalHeight - containerHeight, currentScroll + getItemHeight(0));
        break;
      case 'PageUp':
        e.preventDefault();
        newScroll = Math.max(0, currentScroll - containerHeight);
        break;
      case 'PageDown':
        e.preventDefault();
        newScroll = Math.min(totalHeight - containerHeight, currentScroll + containerHeight);
        break;
      case 'Home':
        e.preventDefault();
        newScroll = 0;
        break;
      case 'End':
        e.preventDefault();
        newScroll = totalHeight - containerHeight;
        break;
    }
    
    if (newScroll !== currentScroll) {
      container.scrollTo({
        top: newScroll,
        behavior: 'smooth',
      });
    }
  }, [enableKeyboardNavigation, getItemHeight, totalHeight, containerHeight]);

  // Scroll to item method
  const scrollToItem = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    if (!containerRef.current || index < 0 || index >= items.length) return;
    
    const position = getItemPosition(index);
    containerRef.current.scrollTo({
      top: position.top,
      behavior,
    });
  }, [items.length, getItemPosition]);

  // Expose scroll methods via ref
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).scrollToItem = scrollToItem;
    }
  }, [scrollToItem]);

  // Render visible items
  const visibleItems = useMemo(() => {
    const elements: React.ReactNode[] = [];
    
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (i >= items.length) break;
      
      const position = getItemPosition(i);
      const item = items[i];
      
      elements.push(
        <div
          key={`${cacheKey || 'item'}-${i}`}
          data-index={i}
          className={`virtual-scroll-item ${itemClassName}`}
          style={{
            position: 'absolute',
            top: position.top,
            left: 0,
            right: 0,
            height: typeof itemHeight === 'function' ? 'auto' : position.height,
            willChange: scrollState.isScrolling ? 'transform' : 'auto',
          }}
          ref={el => {
            if (typeof itemHeight === 'function' && el && resizeObserverRef.current) {
              resizeObserverRef.current.observe(el);
            }
          }}
        >
          {renderItem(item, i)}
        </div>
      );
    }
    
    return elements;
  }, [visibleRange, items, getItemPosition, itemHeight, itemClassName, cacheKey, renderItem, scrollState.isScrolling]);

  // Render loading indicator
  const loadingIndicator = loadingMore && (
    <div className="virtual-scroll-loading" style={{ top: totalHeight }}>
      <div className="loading-spinner" />
      <span>Loading more...</span>
    </div>
  );

  // Render placeholder when no items
  if (items.length === 0 && placeholder) {
    return (
      <div className={`virtual-scroll-placeholder ${className}`}>
        {placeholder}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`virtual-scroll-container ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
        willChange: scrollState.isScrolling ? 'scroll-position' : 'auto',
      }}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      tabIndex={enableKeyboardNavigation ? 0 : -1}
      role="list"
      aria-label="Scrollable list"
      aria-rowcount={items.length}
    >
      <div
        className="virtual-scroll-content"
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems}
        {loadingIndicator}
      </div>
    </div>
  );
}

// Memoized version for performance
export const MemoizedVirtualScroll = React.memo(VirtualScroll) as typeof VirtualScroll;

// Hook for external scroll control
export function useVirtualScroll(ref: React.RefObject<HTMLDivElement>) {
  const scrollToItem = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    if (ref.current && (ref.current as any).scrollToItem) {
      (ref.current as any).scrollToItem(index, behavior);
    }
  }, [ref]);

  const scrollToTop = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (ref.current) {
      ref.current.scrollTo({
        top: 0,
        behavior,
      });
    }
  }, [ref]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (ref.current) {
      ref.current.scrollTo({
        top: ref.current.scrollHeight,
        behavior,
      });
    }
  }, [ref]);

  return {
    scrollToItem,
    scrollToTop,
    scrollToBottom,
  };
}
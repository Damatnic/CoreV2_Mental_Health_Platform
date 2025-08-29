import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { ChevronLeft, ChevronRight, X, Plus, MoreHorizontal } from 'lucide-react';

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
  closable?: boolean;
  tooltip?: string;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onTabAdd?: () => void;
  variant?: 'default' | 'pills' | 'underline' | 'cards';
  size?: 'sm' | 'md' | 'lg';
  position?: 'top' | 'bottom' | 'left' | 'right';
  scrollable?: boolean;
  centered?: boolean;
  fullWidth?: boolean;
  animated?: boolean;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onTabChange,
  onTabClose,
  onTabAdd,
  variant = 'default',
  size = 'md',
  position = 'top',
  scrollable = false,
  centered = false,
  fullWidth = false,
  animated = true,
  className = ''
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(
    controlledActiveTab || defaultTab || tabs[0]?.id
  );
  
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabsListRef = useRef<HTMLDivElement>(null);

  const activeTab = controlledActiveTab || internalActiveTab;

  useEffect(() => {
    if (controlledActiveTab) {
      setInternalActiveTab(controlledActiveTab);
    }
  }, [controlledActiveTab]);

  useEffect(() => {
    if (scrollable) {
      checkScrollability();
      const container = tabsContainerRef.current;
      if (container) {
        container.addEventListener('scroll', updateScrollButtons);
        window.addEventListener('resize', checkScrollability);
        
        return () => {
          container.removeEventListener('scroll', updateScrollButtons);
          window.removeEventListener('resize', checkScrollability);
        };
      }
    }
  }, [tabs, scrollable]);

  const checkScrollability = () => {
    const container = tabsContainerRef.current;
    const list = tabsListRef.current;
    
    if (container && list) {
      const isScrollable = list.scrollWidth > container.clientWidth;
      setShowScrollButtons(isScrollable);
      updateScrollButtons();
    }
  };

  const updateScrollButtons = () => {
    const container = tabsContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    }
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    const container = tabsContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleTabClick = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.disabled) return;

    if (!controlledActiveTab) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  const handleTabClose = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onTabClose?.(tabId);
  };

  const getTabClasses = (tab: Tab) => {
    const baseClasses = 'relative flex items-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
    const isActive = tab.id === activeTab;
    
    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    // Variant classes
    const variantClasses = {
      default: isActive 
        ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
        : 'border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50',
      pills: isActive
        ? 'bg-blue-500 text-white rounded-full shadow-sm'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full',
      underline: isActive
        ? 'border-b-2 border-blue-500 text-blue-600'
        : 'border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300',
      cards: isActive
        ? 'bg-white text-gray-900 border border-gray-200 rounded-t-lg shadow-sm -mb-px'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent rounded-t-lg'
    };

    // Disabled state
    const disabledClasses = tab.disabled 
      ? 'opacity-50 cursor-not-allowed pointer-events-none' 
      : 'cursor-pointer';

    return [
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      disabledClasses
    ].join(' ');
  };

  const getTabListClasses = () => {
    const baseClasses = 'flex';
    const positionClasses = {
      top: 'border-b border-gray-200',
      bottom: 'border-t border-gray-200',
      left: 'flex-col border-r border-gray-200',
      right: 'flex-col border-l border-gray-200'
    };

    const layoutClasses = [
      centered && (position === 'top' || position === 'bottom') ? 'justify-center' : '',
      fullWidth && (position === 'top' || position === 'bottom') ? 'w-full' : '',
      variant === 'cards' ? 'bg-gray-50' : ''
    ].filter(Boolean).join(' ');

    return [
      baseClasses,
      positionClasses[position],
      layoutClasses
    ].join(' ');
  };

  const renderTabContent = () => {
    const activeTabData = tabs.find(tab => tab.id === activeTab);
    
    return (
      <div 
        className={`
          tab-content flex-1 p-4
          ${animated ? 'transition-opacity duration-200' : ''}
          ${position === 'left' || position === 'right' ? 'overflow-auto' : ''}
        `}
      >
        {activeTabData?.content}
      </div>
    );
  };

  const renderScrollButton = (direction: 'left' | 'right') => {
    const canScroll = direction === 'left' ? canScrollLeft : canScrollRight;
    const Icon = direction === 'left' ? ChevronLeft : ChevronRight;

    return (
      <button
        onClick={() => scrollTabs(direction)}
        disabled={!canScroll}
        className={`
          flex items-center justify-center p-2 
          ${canScroll ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}
          transition-colors duration-200
        `}
      >
        <Icon className="w-4 h-4" />
      </button>
    );
  };

  const renderTabList = () => (
    <div className="flex items-center">
      {scrollable && showScrollButtons && renderScrollButton('left')}
      
      <div 
        ref={tabsContainerRef}
        className={`
          flex-1 
          ${scrollable ? 'overflow-x-auto scrollbar-hide' : 'overflow-hidden'}
        `}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div 
          ref={tabsListRef}
          className={`${getTabListClasses()} ${scrollable ? 'min-w-max' : ''}`}
        >
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`${getTabClasses(tab)} ${
                fullWidth && (position === 'top' || position === 'bottom') 
                  ? 'flex-1 justify-center' 
                  : ''
              }`}
              onClick={() => handleTabClick(tab.id)}
              role="tab"
              aria-selected={tab.id === activeTab}
              aria-disabled={tab.disabled}
              tabIndex={tab.disabled ? -1 : 0}
              title={tab.tooltip}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              
              <span className={scrollable ? 'whitespace-nowrap' : ''}>
                {tab.label}
              </span>
              
              {tab.badge && (
                <span className={`
                  inline-flex items-center justify-center min-w-[20px] h-5 px-2 text-xs font-medium rounded-full
                  ${tab.id === activeTab 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                  }
                `}>
                  {tab.badge}
                </span>
              )}
              
              {tab.closable && (
                <button
                  onClick={(e) => handleTabClose(tab.id, e)}
                  className="ml-1 p-0.5 rounded hover:bg-black/10 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          
          {onTabAdd && (
            <button
              onClick={onTabAdd}
              className={`
                flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 
                transition-colors duration-200 rounded
                ${size === 'sm' ? 'px-2 py-1' : size === 'lg' ? 'px-4 py-3' : ''}
              `}
            >
              <Plus className="w-4 h-4" />
              {!scrollable && <span>Add Tab</span>}
            </button>
          )}
        </div>
      </div>
      
      {scrollable && showScrollButtons && renderScrollButton('right')}
    </div>
  );

  const isVertical = position === 'left' || position === 'right';

  return (
    <div 
      className={`
        tabs 
        ${isVertical ? 'flex' : 'flex flex-col'} 
        ${isVertical && position === 'right' ? 'flex-row-reverse' : ''}
        h-full
        ${className}
      `}
    >
      {/* Tab List */}
      <div className={`
        tab-list-container
        ${isVertical ? 'min-w-[200px] max-w-[300px]' : ''}
        ${position === 'bottom' ? 'order-2' : ''}
      `}>
        {renderTabList()}
      </div>

      {/* Tab Content */}
      <div className={`
        tab-content-container flex-1 
        ${variant === 'cards' ? 'bg-white border border-t-0 border-gray-200 rounded-b-lg' : ''}
        ${position === 'bottom' ? 'order-1' : ''}
      `}>
        {renderTabContent()}
      </div>
    </div>
  );
};

// Simplified Tabs component for common use cases
export const SimpleTabs: React.FC<{
  items: Array<{
    key: string;
    label: string;
    content: ReactNode;
    icon?: ReactNode;
  }>;
  defaultActive?: string;
  onChange?: (key: string) => void;
  className?: string;
}> = ({ items, defaultActive, onChange, className }) => {
  const tabs: Tab[] = items.map(item => ({
    id: item.key,
    label: item.label,
    content: item.content,
    icon: item.icon
  }));

  return (
    <Tabs
      tabs={tabs}
      defaultTab={defaultActive}
      onTabChange={onChange}
      className={className}
    />
  );
};

// Mental Health specific tab presets
export const WellnessTabs: React.FC<{
  mood?: ReactNode;
  journal?: ReactNode;
  goals?: ReactNode;
  insights?: ReactNode;
  resources?: ReactNode;
  className?: string;
}> = ({ mood, journal, goals, insights, resources, className }) => {
  const tabs: Tab[] = [
    mood && { id: 'mood', label: 'Mood', content: mood },
    journal && { id: 'journal', label: 'Journal', content: journal },
    goals && { id: 'goals', label: 'Goals', content: goals },
    insights && { id: 'insights', label: 'Insights', content: insights },
    resources && { id: 'resources', label: 'Resources', content: resources }
  ].filter(Boolean) as Tab[];

  return (
    <Tabs
      tabs={tabs}
      variant="pills"
      centered
      animated
      className={className}
    />
  );
};

export default Tabs;

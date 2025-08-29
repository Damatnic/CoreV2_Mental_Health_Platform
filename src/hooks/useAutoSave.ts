/**
 * Auto Save Hook
 *
 * Provides automatic saving functionality with debouncing, draft management,
 * and offline support for mental health platform content.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface DraftData {
  id: string;
  content: string;
  title?: string;
  timestamp: number;
  lastSaved?: number;
  isDirty: boolean;
  metadata?: Record<string, any>;
}

export interface AutoSaveOptions {
  /** Auto-save interval in milliseconds */
  saveInterval?: number;
  /** Debounce delay for user input in milliseconds */
  debounceDelay?: number;
  /** Maximum number of drafts to keep */
  maxDrafts?: number;
  /** Storage key prefix */
  storagePrefix?: string;
  /** Whether to save to localStorage */
  useLocalStorage?: boolean;
  /** Whether to save to sessionStorage */
  useSessionStorage?: boolean;
  /** Custom save function */
  customSave?: (draft: DraftData) => Promise<boolean>;
  /** Custom load function */
  customLoad?: (id: string) => Promise<DraftData | null>;
  /** Callback when save succeeds */
  onSaveSuccess?: (draft: DraftData) => void;
  /** Callback when save fails */
  onSaveError?: (error: Error, draft: DraftData) => void;
  /** Callback when draft is loaded */
  onDraftLoaded?: (draft: DraftData) => void;
  /** Whether to show save indicators */
  showSaveIndicators?: boolean;
  /** Whether to enable offline mode */
  enableOfflineMode?: boolean;
  /** Whether to auto-restore on mount */
  autoRestore?: boolean;
}

export interface AutoSaveState {
  /** Whether auto-save is currently enabled */
  isEnabled: boolean;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Last save timestamp */
  lastSaved: number | null;
  /** Last save error */
  lastError: Error | null;
  /** Current draft being worked on */
  currentDraft: DraftData | null;
  /** Available drafts */
  availableDrafts: DraftData[];
  /** Save status message */
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

export interface AutoSaveActions {
  /** Save current content immediately */
  saveNow: () => Promise<boolean>;
  /** Load a specific draft */
  loadDraft: (id: string) => Promise<DraftData | null>;
  /** Delete a draft */
  deleteDraft: (id: string) => Promise<boolean>;
  /** Clear all drafts */
  clearAllDrafts: () => Promise<boolean>;
  /** Enable/disable auto-save */
  setEnabled: (enabled: boolean) => void;
  /** Update content to be auto-saved */
  updateContent: (content: string, title?: string, metadata?: Record<string, any>) => void;
  /** Create new draft */
  createNewDraft: (id?: string) => DraftData;
  /** Get draft by ID */
  getDraft: (id: string) => DraftData | null;
  /** Restore from last save */
  restoreLastSave: () => Promise<DraftData | null>;
}

export interface UseAutoSaveReturn {
  state: AutoSaveState;
  actions: AutoSaveActions;
}

const DEFAULT_OPTIONS: Required<Omit<AutoSaveOptions, 'customSave' | 'customLoad' | 'onSaveSuccess' | 'onSaveError' | 'onDraftLoaded'>> = {
  saveInterval: 30000, // 30 seconds
  debounceDelay: 2000, // 2 seconds
  maxDrafts: 10,
  storagePrefix: 'autosave',
  useLocalStorage: true,
  useSessionStorage: false,
  showSaveIndicators: true,
  enableOfflineMode: true,
  autoRestore: true
};

/**
 * Hook for automatic saving with draft management
 */
export const useAutoSave = (
  initialContent: string = '',
  draftId: string = 'default',
  options: AutoSaveOptions = {}
): UseAutoSaveReturn => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<AutoSaveState>({
    isEnabled: true,
    isSaving: false,
    isDirty: false,
    lastSaved: null,
    lastError: null,
    currentDraft: null,
    availableDrafts: [],
    saveStatus: 'idle'
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentContentRef = useRef<string>(initialContent);
  const currentTitleRef = useRef<string>('');
  const currentMetadataRef = useRef<Record<string, any>>({});

  /**
   * Generate storage key
   */
  const getStorageKey = useCallback((id: string): string => {
    return `${opts.storagePrefix}_${id}`;
  }, [opts.storagePrefix]);

  /**
   * Get storage mechanism
   */
  const getStorage = useCallback((): Storage | null => {
    try {
      if (opts.useLocalStorage && typeof localStorage !== 'undefined') {
        return localStorage;
      }
      if (opts.useSessionStorage && typeof sessionStorage !== 'undefined') {
        return sessionStorage;
      }
    } catch (error) {
      console.warn('Storage not available:', error);
    }
    return null;
  }, [opts.useLocalStorage, opts.useSessionStorage]);

  /**
   * Save draft to storage
   */
  const saveDraftToStorage = useCallback(async (draft: DraftData): Promise<boolean> => {
    try {
      const storage = getStorage();
      if (storage) {
        storage.setItem(getStorageKey(draft.id), JSON.stringify(draft));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save draft to storage:', error);
      return false;
    }
  }, [getStorage, getStorageKey]);

  /**
   * Load draft from storage
   */
  const loadDraftFromStorage = useCallback(async (id: string): Promise<DraftData | null> => {
    try {
      const storage = getStorage();
      if (storage) {
        const stored = storage.getItem(getStorageKey(id));
        if (stored) {
          return JSON.parse(stored) as DraftData;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to load draft from storage:', error);
      return null;
    }
  }, [getStorage, getStorageKey]);

  /**
   * Get all available drafts
   */
  const getAllDrafts = useCallback(async (): Promise<DraftData[]> => {
    try {
      const storage = getStorage();
      if (!storage) return [];

      const drafts: DraftData[] = [];
      const prefix = `${opts.storagePrefix}_`;

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(prefix)) {
          try {
            const stored = storage.getItem(key);
            if (stored) {
              const draft = JSON.parse(stored) as DraftData;
              drafts.push(draft);
            }
          } catch (error) {
            console.warn('Failed to parse draft:', key, error);
          }
        }
      }

      // Sort by timestamp (newest first)
      return drafts.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get all drafts:', error);
      return [];
    }
  }, [getStorage, opts.storagePrefix]);

  /**
   * Clean up old drafts
   */
  const cleanupOldDrafts = useCallback(async (): Promise<void> => {
    try {
      const allDrafts = await getAllDrafts();
      if (allDrafts.length <= opts.maxDrafts) return;

      const storage = getStorage();
      if (!storage) return;

      // Remove oldest drafts
      const draftsToRemove = allDrafts.slice(opts.maxDrafts);
      for (const draft of draftsToRemove) {
        storage.removeItem(getStorageKey(draft.id));
      }
    } catch (error) {
      console.error('Failed to cleanup old drafts:', error);
    }
  }, [getAllDrafts, opts.maxDrafts, getStorage, getStorageKey]);

  /**
   * Perform save operation
   */
  const performSave = useCallback(async (draft: DraftData): Promise<boolean> => {
    setState(prev => ({ ...prev, isSaving: true, saveStatus: 'saving' }));

    try {
      let success = false;

      // Use custom save function if provided
      if (options.customSave) {
        success = await options.customSave(draft);
      } else {
        success = await saveDraftToStorage(draft);
      }

      if (success) {
        const savedDraft = {
          ...draft,
          lastSaved: Date.now(),
          isDirty: false
        };

        setState(prev => ({
          ...prev,
          isSaving: false,
          isDirty: false,
          lastSaved: savedDraft.lastSaved,
          lastError: null,
          currentDraft: savedDraft,
          saveStatus: 'saved'
        }));

        // Update available drafts
        const allDrafts = await getAllDrafts();
        setState(prev => ({ ...prev, availableDrafts: allDrafts }));

        // Cleanup old drafts
        await cleanupOldDrafts();

        // Call success callback
        if (options.onSaveSuccess) {
          options.onSaveSuccess(savedDraft);
        }

        // Reset save status after a delay
        setTimeout(() => {
          setState(prev => ({ ...prev, saveStatus: 'idle' }));
        }, 2000);

        return true;
      } else {
        throw new Error('Save operation failed');
      }
    } catch (error) {
      const saveError = error as Error;
      
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastError: saveError,
        saveStatus: 'error'
      }));

      // Call error callback
      if (options.onSaveError) {
        options.onSaveError(saveError, draft);
      }

      console.error('Auto-save failed:', saveError);
      return false;
    }
  }, [options, saveDraftToStorage, getAllDrafts, cleanupOldDrafts]);

  /**
   * Save current content immediately
   */
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (!state.isEnabled) return false;

    const draft: DraftData = {
      id: draftId,
      content: currentContentRef.current,
      title: currentTitleRef.current,
      timestamp: Date.now(),
      isDirty: true,
      metadata: currentMetadataRef.current
    };

    return await performSave(draft);
  }, [state.isEnabled, draftId, performSave]);

  /**
   * Load a specific draft
   */
  const loadDraft = useCallback(async (id: string): Promise<DraftData | null> => {
    try {
      let draft: DraftData | null = null;

      // Use custom load function if provided
      if (options.customLoad) {
        draft = await options.customLoad(id);
      } else {
        draft = await loadDraftFromStorage(id);
      }

      if (draft) {
        setState(prev => ({
          ...prev,
          currentDraft: draft,
          lastSaved: draft.lastSaved || null,
          isDirty: draft.isDirty || false
        }));

        // Update refs
        currentContentRef.current = draft.content;
        currentTitleRef.current = draft.title || '';
        currentMetadataRef.current = draft.metadata || {};

        // Call loaded callback
        if (options.onDraftLoaded) {
          options.onDraftLoaded(draft);
        }
      }

      return draft;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [options, loadDraftFromStorage]);

  /**
   * Delete a draft
   */
  const deleteDraft = useCallback(async (id: string): Promise<boolean> => {
    try {
      const storage = getStorage();
      if (storage) {
        storage.removeItem(getStorageKey(id));
        
        // Update available drafts
        const allDrafts = await getAllDrafts();
        setState(prev => ({ ...prev, availableDrafts: allDrafts }));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete draft:', error);
      return false;
    }
  }, [getStorage, getStorageKey, getAllDrafts]);

  /**
   * Clear all drafts
   */
  const clearAllDrafts = useCallback(async (): Promise<boolean> => {
    try {
      const storage = getStorage();
      if (!storage) return false;

      const prefix = `${opts.storagePrefix}_`;
      const keysToRemove: string[] = [];

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        storage.removeItem(key);
      }

      setState(prev => ({
        ...prev,
        availableDrafts: [],
        currentDraft: null,
        lastSaved: null,
        isDirty: false
      }));

      return true;
    } catch (error) {
      console.error('Failed to clear all drafts:', error);
      return false;
    }
  }, [getStorage, opts.storagePrefix]);

  /**
   * Enable/disable auto-save
   */
  const setEnabled = useCallback((enabled: boolean): void => {
    setState(prev => ({ ...prev, isEnabled: enabled }));
    
    if (enabled && autoSaveIntervalRef.current === null) {
      // Restart auto-save interval
      autoSaveIntervalRef.current = setInterval(() => {
        if (state.isDirty && !state.isSaving) {
          saveNow();
        }
      }, opts.saveInterval);
    } else if (!enabled && autoSaveIntervalRef.current) {
      // Stop auto-save interval
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }
  }, [state.isDirty, state.isSaving, saveNow, opts.saveInterval]);

  /**
   * Update content to be auto-saved
   */
  const updateContent = useCallback((
    content: string, 
    title?: string, 
    metadata?: Record<string, any>
  ): void => {
    currentContentRef.current = content;
    if (title !== undefined) currentTitleRef.current = title;
    if (metadata !== undefined) currentMetadataRef.current = metadata;

    setState(prev => ({ ...prev, isDirty: true }));

    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new debounce timeout
    debounceTimeoutRef.current = setTimeout(() => {
      if (state.isEnabled && !state.isSaving) {
        saveNow();
      }
    }, opts.debounceDelay);
  }, [state.isEnabled, state.isSaving, saveNow, opts.debounceDelay]);

  /**
   * Create new draft
   */
  const createNewDraft = useCallback((id?: string): DraftData => {
    const newId = id || `draft_${Date.now()}`;
    const draft: DraftData = {
      id: newId,
      content: '',
      timestamp: Date.now(),
      isDirty: false
    };

    setState(prev => ({ ...prev, currentDraft: draft }));
    return draft;
  }, []);

  /**
   * Get draft by ID
   */
  const getDraft = useCallback((id: string): DraftData | null => {
    return state.availableDrafts.find(draft => draft.id === id) || null;
  }, [state.availableDrafts]);

  /**
   * Restore from last save
   */
  const restoreLastSave = useCallback(async (): Promise<DraftData | null> => {
    return await loadDraft(draftId);
  }, [loadDraft, draftId]);

  // Initialize hook
  useEffect(() => {
    const initialize = async () => {
      // Load available drafts
      const allDrafts = await getAllDrafts();
      setState(prev => ({ ...prev, availableDrafts: allDrafts }));

      // Auto-restore if enabled
      if (opts.autoRestore) {
        const existingDraft = await loadDraft(draftId);
        if (existingDraft) {
          // Draft was loaded, content refs are updated
        } else {
          // Create new draft with initial content
          currentContentRef.current = initialContent;
          setState(prev => ({
            ...prev,
            currentDraft: {
              id: draftId,
              content: initialContent,
              timestamp: Date.now(),
              isDirty: false
            }
          }));
        }
      }

      // Setup auto-save interval
      if (state.isEnabled) {
        autoSaveIntervalRef.current = setInterval(() => {
          if (state.isDirty && !state.isSaving) {
            saveNow();
          }
        }, opts.saveInterval);
      }
    };

    initialize();

    return () => {
      // Cleanup timeouts and intervals
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [draftId, initialContent, opts.autoRestore, opts.saveInterval, getAllDrafts, loadDraft, saveNow, state.isEnabled, state.isDirty, state.isSaving]);

  // Handle page unload - attempt final save
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.isDirty && !state.isSaving) {
        // Attempt synchronous save
        const draft: DraftData = {
          id: draftId,
          content: currentContentRef.current,
          title: currentTitleRef.current,
          timestamp: Date.now(),
          isDirty: true,
          metadata: currentMetadataRef.current
        };

        try {
          const storage = getStorage();
          if (storage) {
            storage.setItem(getStorageKey(draft.id), JSON.stringify(draft));
          }
        } catch (error) {
          console.error('Failed to save on unload:', error);
        }

        // Show confirmation dialog
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.isDirty, state.isSaving, draftId, getStorage, getStorageKey]);

  return {
    state,
    actions: {
      saveNow,
      loadDraft,
      deleteDraft,
      clearAllDrafts,
      setEnabled,
      updateContent,
      createNewDraft,
      getDraft,
      restoreLastSave
    }
  };
};

/**
 * React 18 Testing Fix
 *
 * Provides a working render implementation for React 18 with React Testing Library.
 * Handles the transition from ReactDOM.render to createRoot API while maintaining
 * compatibility with existing test utilities.
 * 
 * @fileoverview React 18 compatibility utilities for testing
 * @version 2.0.0
 */

import React, { ReactElement } from 'react';
import { queries, RenderOptions, RenderResult } from '@testing-library/react';
import { createRoot, Root } from 'react-dom/client';
import { act } from '@testing-library/react';

/**
 * Custom render options extending RTL's RenderOptions
 */
export interface React18RenderOptions extends Omit<RenderOptions, 'queries'> {
  queries?: typeof queries;
}

/**
 * Enhanced render result with React 18 specific utilities
 */
export interface React18RenderResult extends RenderResult {
  root: Root | null;
}

/**
 * Renders a React element using React 18's createRoot API
 * while maintaining compatibility with React Testing Library
 */
export function renderWithReact18(
  ui: ReactElement,
  options?: React18RenderOptions
): React18RenderResult {
  // Ensure we have a document.body
  if (typeof document === 'undefined') {
    throw new Error('document is not defined');
  }

  if (!document.body) {
    const body = document.createElement('body');
    if (document.documentElement) {
      document.documentElement.appendChild(body);
    }
  }

  // Create container
  const container = document.createElement('div');
  container.setAttribute('data-testid', 'react18-container');
  document.body.appendChild(container);

  // Create root and render
  let root: Root | null = null;
  
  act(() => {
    root = createRoot(container);
    const Wrapper = options?.wrapper || React.Fragment;
    root.render(<Wrapper>{ui}</Wrapper>);
  });

  // Create query functions bound to container
  const boundQueries = Object.entries(queries).reduce((acc, [key, query]) => {
    if (typeof query === 'function') {
      acc[key as keyof typeof queries] = query.bind(null, container) as any;
    }
    return acc;
  }, {} as typeof queries);

  // Return RTL-compatible result
  const result: React18RenderResult = {
    container,
    baseElement: document.body,
    root,
    
    debug: (element = container) => {
      console.log(require('pretty-format').format(element, {
        plugins: [
          require('pretty-format').plugins.DOMElement,
          require('pretty-format').plugins.DOMCollection
        ]
      }));
    },
    
    unmount: () => {
      act(() => {
        root?.unmount();
      });
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    },
    
    rerender: (newUi: ReactElement) => {
      act(() => {
        const Wrapper = options?.wrapper || React.Fragment;
        root?.render(<Wrapper>{newUi}</Wrapper>);
      });
    },
    
    asFragment: () => {
      const template = document.createElement('template');
      template.innerHTML = container.innerHTML;
      return template.content;
    },
    
    ...boundQueries
  };

  return result;
}

/**
 * Cleanup function for React 18 tests
 */
export function cleanupReact18(): void {
  // Remove all test containers
  const containers = document.querySelectorAll('[data-testid="react18-container"]');
  containers.forEach(container => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });
}

/**
 * React 18 compatible act function with better error handling
 */
export async function actReact18(callback: () => void | Promise<void>): Promise<void> {
  return act(async () => {
    await callback();
  });
}

/**
 * Batch multiple React 18 updates for better performance
 */
export function batchUpdates(callback: () => void): void {
  // React 18 automatically batches updates, but we can still use act for consistency
  act(() => {
    callback();
  });
}

/**
 * Helper to wait for React 18 concurrent features
 */
export async function waitForReact18Updates(): Promise<void> {
  return act(async () => {
    // Allow React to process any pending updates
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

/**
 * Mock Suspense boundary for testing
 */
export const MockSuspenseBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = <div>Loading...</div> }) => {
  return (
    <React.Suspense fallback={fallback}>
      {children}
    </React.Suspense>
  );
};

/**
 * Mock Error Boundary for testing
 */
export class MockErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}

/**
 * React 18 testing utilities export
 */
export const React18TestUtils = {
  render: renderWithReact18,
  cleanup: cleanupReact18,
  act: actReact18,
  batchUpdates,
  waitForUpdates: waitForReact18Updates,
  MockSuspenseBoundary,
  MockErrorBoundary
};

export default React18TestUtils;

/**
 * Testing Library Export Module
 * 
 * Centralized re-export of all @testing-library/react functions
 * to resolve TypeScript import issues across the test suite
 */

// Import all the needed functions from @testing-library/react
import {
  render as rtlRender,
  screen,
  fireEvent,
  waitFor,
  within,
  cleanup,
  act,
  renderHook,
  waitForElementToBeRemoved,
  prettyDOM,
  getDefaultNormalizer,
  queries,
  queryHelpers,
  buildQueries,
  configure,
  getNodeText,
  getRoles,
  isInaccessible,
  logDOM,
  logRoles,
  getQueriesForElement,
  queryByAttribute,
  queryAllByAttribute,
  RenderOptions,
  RenderResult,
  RenderHookOptions,
  RenderHookResult
} from '@testing-library/react';

// Import userEvent separately
import userEvent from '@testing-library/user-event';

// Re-export everything
export {
  rtlRender,
  rtlRender as render,
  screen,
  fireEvent,
  waitFor,
  within,
  cleanup,
  act,
  renderHook,
  waitForElementToBeRemoved,
  prettyDOM,
  getDefaultNormalizer,
  queries,
  queryHelpers,
  buildQueries,
  configure,
  getNodeText,
  getRoles,
  isInaccessible,
  logDOM,
  logRoles,
  getQueriesForElement,
  queryByAttribute,
  queryAllByAttribute,
  userEvent
};

// Re-export types
export type {
  RenderOptions,
  RenderResult,
  RenderHookOptions,
  RenderHookResult,
  Queries,
  BoundFunctions,
  QueryByBoundAttribute,
  AllByBoundAttribute,
  FindAllByBoundAttribute,
  GetByBoundAttribute,
  FindByBoundAttribute,
  QueryAllByBoundAttribute
} from '@testing-library/react';

// Export default object with all utilities
export default {
  render: rtlRender,
  screen,
  fireEvent,
  waitFor,
  within,
  cleanup,
  act,
  renderHook,
  waitForElementToBeRemoved,
  userEvent
};
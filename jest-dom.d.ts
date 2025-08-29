// Jest DOM types extension
/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R, T = {}> {
      /**
       * @description
       * This allows you to check whether the given element is present in the document or not.
       */
      toBeInTheDocument(): R;
      /**
       * @description
       * This allows you to check whether the given form element has the specified value.
       */
      toHaveValue(value: string | string[] | number): R;
      /**
       * @description
       * This allows you to check if an element is currently visible to the user.
       */
      toBeVisible(): R;
      /**
       * @description
       * This API allows you to check whether the given element has a text content or not.
       */
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace?: boolean }): R;
      /**
       * @description
       * This allows you to check whether the given element has an attribute or not.
       */
      toHaveAttribute(attr: string, value?: string): R;
      /**
       * @description
       * This allows you to check whether the given element has certain classes within its class attribute.
       */
      toHaveClass(...classNames: string[]): R;
      /**
       * @description
       * This allows you to check whether an element is disabled from the user's perspective.
       */
      toBeDisabled(): R;
      /**
       * @description
       * This allows you to check whether an element is not disabled from the user's perspective.
       */
      toBeEnabled(): R;
      /**
       * @description
       * This allows you to assert whether an element has no visible content for the user.
       */
      toBeEmptyDOMElement(): R;
      /**
       * @description
       * This allows you to check if a form element is currently required.
       */
      toBeRequired(): R;
      /**
       * @description
       * This allows you to check if the value of an input is currently valid according to the browser's constraint validation.
       */
      toBeValid(): R;
      /**
       * @description
       * This allows you to check if the value of an input is currently invalid according to the browser's constraint validation.
       */
      toBeInvalid(): R;
      /**
       * @description
       * This allows you to assert whether an element currently has focus.
       */
      toHaveFocus(): R;
      /**
       * @description
       * This allows you to check if a certain element has some specific css properties with specific values applied.
       */
      toHaveStyle(css: string | Record<string, any>): R;
    }
  }
}

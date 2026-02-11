import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../context/AppContext';
import { ToastProvider } from '../../components/Toast';

type Options = {
  route?: string;
  withRouter?: boolean;
};

export function renderWithProviders(ui: React.ReactElement, options: Options = {}) {
  const { route = '/', withRouter = true } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    const content = (
      <AppProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AppProvider>
    );
    if (withRouter) {
      return <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>;
    }
    return content;
  }

  return render(ui, { wrapper: Wrapper });
}

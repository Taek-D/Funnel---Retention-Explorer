import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { router } from './router';

const App: React.FC = () => (
  <AppProvider>
    <RouterProvider router={router} />
  </AppProvider>
);

export default App;

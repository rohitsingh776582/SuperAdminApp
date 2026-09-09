import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import UserRoutes from './routes/user.routes';
import { StoreProvider } from './context/StoreContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <StoreProvider>
          <UserRoutes />
        </StoreProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

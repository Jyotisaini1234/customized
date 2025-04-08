import { RootState } from './store/store';
import { useSelector } from 'react-redux';
import Loader from './components/Loader/Loader.tsx';
import  Router  from './routes/Router.tsx';
import { ErrorBoundary } from './components/error-boundary/ErrorBoundary.tsx';
import AlertDialog from './components/common/AlertDialog.tsx';
import NotFound from './components/NotFound/NotFound.tsx';
import React from 'react';
import { SearchProvider } from './constants/SearchContext.tsx';

const App: React.FC  = () =>  {
  const loader = useSelector((state: RootState) => state.loader);
  const alert = useSelector((state: RootState) => state.alert);
  const error = useSelector((state: RootState) => state.error);

  return (
    <ErrorBoundary>
      {error.isPageNotFound && <NotFound />}
      {loader.isLoading && !error.isPageNotFound && <Loader oMessage={loader.oMessage} />}
      <AlertDialog {...alert}></AlertDialog>
      {!error.isPageNotFound && (
        <main>
          <SearchProvider>
          <Router />
          </SearchProvider>
        </main>
      )}
    </ErrorBoundary>
  );
};

export default App ;


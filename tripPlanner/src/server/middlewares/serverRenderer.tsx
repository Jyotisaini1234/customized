
// import { renderToString } from 'react-dom/server';
// import { Response, RequestHandler } from 'express';
// import { ChunkExtractor } from '@loadable/server'; 
// import { Provider } from 'react-redux';  
// import { StaticRouter } from 'react-router-dom';  
// import App from '../../App'; 
 
// import HelmetAsync from 'react-helmet-async'; 
// import { ROUTE_CONSTANTS } from '../../constants/routeConstans';
// import { RootState } from '../../store/rootReducer';
// import initStore from '../../store/store';
// const { HelmetProvider } = HelmetAsync; 

// const serverRenderer = (chunkExtractor: ChunkExtractor):
//   RequestHandler => async (req: any, res: Response, next: Function) => {
//     const isPageAvailable = (Object.values(ROUTE_CONSTANTS) as string[]).includes(req.path);
//     if (!isPageAvailable) {
//       req.url = ROUTE_CONSTANTS.NOT_FOUND; 
//     }

//     res.type('html'); 

//     const location: string = req.url;  
//     let preloadedState: Partial<RootState> = {};  // Initialize preloaded state
//     const store = initStore(preloadedState);  // Create Redux store with initial state

//     // Fetch additional data (if needed) based on cookies
//     if (req?.headers?.cookie) {
//       console.log("Fetching data for SagarUsername...");
//     }

//     preloadedState = { ...store.getState() };  // Set preloaded state with Redux store data

//     const helmetContext = {};  // Initialize context for Helmet

//     // Create JSX for server-side rendering
//     const jsx = (
//       <Provider store={store}>  
//         <HelmetProvider context={helmetContext}>  
//           <StaticRouter location={location}> 
//             <App /> 
//           </StaticRouter>
//         </HelmetProvider>
//       </Provider>
//     );

//     // Render the app to a string
//     const reactHtml = renderToString(jsx);
    
//     res.status(200).send(reactHtml);
//   };

// export { serverRenderer };

import { Request, Response, NextFunction } from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ChunkExtractor } from '@loadable/server';
import App from '../../App'; // Your main App component
import path from 'path';

export const serverRenderer = (chunkExtractor: ChunkExtractor) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Render the React app to a string
      const jsx = chunkExtractor.collectChunks(<App />);
      const html = renderToString(jsx);

      // Inject the rendered HTML into the template
      const template = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>SSR App</title>
            ${chunkExtractor.getLinkTags()}  <!-- Link to CSS -->
            ${chunkExtractor.getStyleTags()} <!-- Inline styles -->
          </head>
          <body>
            <div id="root">${html}</div>
            ${chunkExtractor.getScriptTags()} <!-- JS scripts -->
          </body>
        </html>
      `;

      // Send the HTML response
      res.status(200).send(template);
    } catch (error) {
      next(error); // Pass errors to the error handler
    }
  };
};

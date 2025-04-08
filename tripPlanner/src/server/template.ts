// import { ChunkExtractor } from "@loadable/server";

// /**
//  * Generates a full HTML template for server-side rendering
//  * @param appHtml The rendered app content as an HTML string
//  * @param extractor The ChunkExtractor instance for loading CSS and JS chunks
//  * @returns Full HTML page as a string
//  */
// export const renderHtml = (appHtml: string, extractor: ChunkExtractor): string => {
//   const styles = extractor.getStyleTags(); // CSS as <link> tags
//   const scripts = extractor.getScriptTags(); // JS as <script> tags

//   return `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>My Server-Rendered App</title>
//       ${styles} <!-- Extracted CSS -->
//     </head>
//     <body>
//       <div id="root">${appHtml}</div> <!-- App content -->
//       ${scripts} <!-- Extracted JS -->
//     </body>
//     </html>
//   `;
// };

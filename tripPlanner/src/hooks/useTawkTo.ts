// import { useEffect } from 'react';

// declare global {
//   interface Window {
//     Tawk_API: any;
//     Tawk_LoadStart: Date;
//   }
// }

// const useTawkTo = () => {
//   useEffect(() => {
//     // Initialize Tawk.to
//     window.Tawk_API = window.Tawk_API || {};
//     window.Tawk_LoadStart = new Date();

//     const script = document.createElement('script');
//     script.async = true;
//     script.src = 'https://embed.tawk.to/68a18985b25b86192ad77f5b/1j2rg2cum';
//     script.charset = 'UTF-8';
//     script.setAttribute('crossorigin', '*');

//     const firstScript = document.getElementsByTagName('script')[0];
//     firstScript.parentNode?.insertBefore(script, firstScript);

//     // Cleanup function to remove script when component unmounts
//     return () => {
//       const tawkScript = document.querySelector('script[src*="tawk.to"]');
//       if (tawkScript) {
//         tawkScript.remove();
//       }
      
//       // Remove Tawk widget elements
//       const tawkWidget = document.getElementById('tawkchat-minified-box');
//       const tawkContainer = document.getElementById('tawkchat-container');
//       if (tawkWidget) tawkWidget.remove();
//       if (tawkContainer) tawkContainer.remove();
//     };
//   }, []);

//   const openChat = () => {
//     if (window.Tawk_API) {
//       window.Tawk_API.maximize();
//     } else {
//       console.warn('Tawk.to is not loaded yet');
//     }
//   };

//   const minimizeChat = () => {
//     if (window.Tawk_API) {
//       window.Tawk_API.minimize();
//     }
//   };

//   const hideChat = () => {
//     if (window.Tawk_API) {
//       window.Tawk_API.hideWidget();
//     }
//   };

//   const showChat = () => {
//     if (window.Tawk_API) {
//       window.Tawk_API.showWidget();
//     }
//   };

//   const getChatStatus = (): Promise<string> => {
//     return new Promise((resolve) => {
//       if (window.Tawk_API) {
//         window.Tawk_API.getStatus((status: string) => {
//           resolve(status);
//         });
//       } else {
//         resolve('offline');
//       }
//     });
//   };

//   return {
//     openChat,
//     minimizeChat,
//     hideChat,
//     showChat,
//     getChatStatus
//   };
// };

// export default useTawkTo;
// import Navbar from '@/components/common/Navbar';
// import Footer from '@/components/common/Footer';
// import Home from '@/components/Home/Home';
// import '@/utils/i18n.ts';
// import { Route, Routes, useLocation } from 'react-router-dom'
// import Download from '@/components/Download/Download';
// import Features from '@/components/Features/Features';
// import About from '@/components/About/About';
// import Contact from '@/components/Contact/Contact';
// import NotFound from '@/components/common/NotFound';
// import { useEffect } from 'react';
// import Subscription from '@/components/Subscription/Subscription';
// console.log(navigator.language);
// console.log(navigator.languages);
// const App = () => {
//
//   const { pathname } = useLocation();
//
//   useEffect(() => {
//     window.scrollTo(0, 0);
//   }, [pathname]);
//
//   return (
//     <div className="max-container padding-container relative">
//       <Navbar />
//       <main>
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/download" element={<Download />} />
//           <Route path="/subscription" element={<Subscription />} />
//           <Route path="/features" element={<Features />} />
//           <Route path="/about" element={<About />} />
//           <Route path="/contact" element={<Contact />} />
//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </main>
//       <Footer />
//     </div>
//   );
// };
//
// export default App;

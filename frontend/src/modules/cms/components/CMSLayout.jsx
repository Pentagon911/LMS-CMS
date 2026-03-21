// components/CMSLayout.jsx
import { useEffect, useState } from "react";
import Header from "./Header";

const CMSLayout = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(localStorage.getItem('theme') === 'dark');
    };
    window.addEventListener('storage', checkTheme);
    const interval = setInterval(checkTheme, 100);
    return () => {
      window.removeEventListener('storage', checkTheme);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <Header />
      <main style={{
        paddingTop: '70px',
        minHeight: '100vh',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1a1e24 0%, #0f1217 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #e9ecf2 100%)',
        transition: 'background 0.3s ease'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '24px 32px',
          '@media (max-width: 768px)': {
            padding: '20px 24px'
          },
          '@media (max-width: 480px)': {
            padding: '16px'
          }
        }}>
          {children}
        </div>
      </main>
    </>
  );
};

export default CMSLayout;

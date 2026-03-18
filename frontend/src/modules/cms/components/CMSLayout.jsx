// components/CMSLayout.jsx
import Header from "./Header";

const CMSLayout = ({ children }) => {
  // Mock user data for CMS
  const user = {
    name: 'CMS Admin',
    email: 'admin@cms.com',
    avatar: null,
  };

  const handleLogout = () => {
    console.log('Logout from CMS');
    // Add your logout logic here
  };

  return (
    <>
      <Header user={user} onLogout={handleLogout} />
      {/* Add gradient background to the main content area */}
      <main 
        style={{ 
          paddingTop: '70px',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        {children}
      </main>
    </>
  );
};

export default CMSLayout;

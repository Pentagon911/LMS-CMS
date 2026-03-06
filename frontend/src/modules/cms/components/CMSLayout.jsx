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
      <main style={{ paddingTop: '70px' }}>
        {children}
      </main>
    </>
  );
};

export default CMSLayout;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
// Import the 'App' component from Ant Design
import { App, Layout, Menu, Button, Spin } from 'antd'; 
import {
  HomeOutlined,
  LoginOutlined,
  UserAddOutlined,
  DashboardOutlined,
  TeamOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Components
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientDashboard from './pages/PatientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AnnotationPage from './pages/AnnotationPage';

const { Header, Content, Sider, Footer } = Layout;

// The component for the main layout structure
const AppLayout = () => {
  const { user, logout, loading } = useAuth();
  const location = useLocation();

  // Updated function to generate menu items as an array of objects
  const getMenuItems = () => {
    const publicItems = [
      { key: '/', icon: <HomeOutlined />, label: <Link to="/">Home</Link> },
      { key: '/login', icon: <LoginOutlined />, label: <Link to="/login">Login</Link> },
      { key: '/register', icon: <UserAddOutlined />, label: <Link to="/register">Register</Link> },
    ];

    if (!user) {
      return publicItems;
    }

    const patientItems = [
      { key: '/', icon: <HomeOutlined />, label: <Link to="/">Home</Link> },
      { key: '/patient-dashboard', icon: <TeamOutlined />, label: <Link to="/patient-dashboard">Patient Dashboard</Link> },
    ];

    const adminItems = [
      { key: '/', icon: <HomeOutlined />, label: <Link to="/">Home</Link> },
      { key: '/admin-dashboard', icon: <DashboardOutlined />, label: <Link to="/admin-dashboard">Admin Dashboard</Link> },
    ];

    return user.role === 'admin' ? adminItems : patientItems;
  };
  
  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <img src="/logo.png" alt="OralVis Logo" style={{ width: '90%' }} />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {user && (
            <Button type="primary" icon={<LogoutOutlined />} onClick={logout}>Logout</Button>
          )}
        </Header>
        <Content style={{ margin: '16px' }}>
          <div style={{ padding: 24, minHeight: 360, background: '#fff' }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/patient-dashboard" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />
              <Route path="/admin-dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/annotate/:submissionId" element={<ProtectedRoute roles={['admin']}><AnnotationPage /></ProtectedRoute>} />
            </Routes>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>OralVis Healthcare ©2025</Footer>
      </Layout>
    </Layout>
  );
};

// The main App component, now named MainApp
function MainApp() {
  return (
    <Router>
      <AuthProvider>
        {/* The Ant Design <App> wrapper enables message pop-ups */}
        <App>
          <AppLayout />
        </App>
      </AuthProvider>
    </Router>
  );
}

export default MainApp;

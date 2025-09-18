import React from 'react';
// "Space" has been added to the import line below
import { Button, Typography, Row, Col, Space, Timeline } from 'antd';
import {
  LoginOutlined,
  UserAddOutlined,
  CameraOutlined,
  FileSearchOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph } = Typography;

const HomePage = () => {
  const { user } = useAuth();

  // Component for the main welcome/hero section
  const HeroSection = () => (
    <Row justify="center" align="middle" style={{ background: '#f0f2f5', padding: '80px 0' }}>
      <Col span={22} style={{ textAlign: 'center' }}>
        <Title level={1}>A New Vision for Dental Care</Title>
        <Paragraph style={{ fontSize: '18px', maxWidth: '600px', margin: 'auto' }}>
          OralVis Healthcare provides cutting-edge remote dental screening. Get professional evaluations from the comfort of your home.
        </Paragraph>
        <div style={{ marginTop: '32px' }}>
          {user ? (
            <Link to={user.role === 'admin' ? '/admin-dashboard' : '/patient-dashboard'}>
              <Button type="primary" size="large">
                Go to Your Dashboard
              </Button>
            </Link>
          ) : (
            <Space size="large">
              <Link to="/login">
                <Button type="primary" size="large" icon={<LoginOutlined />}>
                  Member Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="large" icon={<UserAddOutlined />}>
                  Create Account
                </Button>
              </Link>
            </Space>
          )}
        </div>
      </Col>
    </Row>
  );

  // Component for the "How It Works" section
  const HowItWorksSection = () => (
    <div style={{ padding: '80px 24px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '64px' }}>
        Simple Steps to a Healthier Smile
      </Title>
      <Row justify="center" gutter={[32, 32]}>
        <Col xs={24} md={8} style={{ textAlign: 'center' }}>
          <CameraOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          <Title level={4} style={{ marginTop: '16px' }}>1. Submit Your Images</Title>
          <Paragraph>Securely upload photos of your dental concern through our patient portal.</Paragraph>
        </Col>
        <Col xs={24} md={8} style={{ textAlign: 'center' }}>
          <FileSearchOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          <Title level={4} style={{ marginTop: '16px' }}>2. Expert Evaluation</Title>
          <Paragraph>Our certified dental professionals will review your submission and provide a detailed annotation.</Paragraph>
        </Col>
        <Col xs={24} md={8} style={{ textAlign: 'center' }}>
          <MessageOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          <Title level={4} style={{ marginTop: '16px' }}>3. Receive Feedback</Title>
          <Paragraph>Get timely, professional feedback and recommendations directly in your dashboard.</Paragraph>
        </Col>
      </Row>
    </div>
  );

  return (
    <>
      <HeroSection />
      <HowItWorksSection />
    </>
  );
};

export default HomePage;

import React, { useState } from 'react';
import { Form, Input, Button, Alert, Card, Row, Col, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const LoginPage = () => {
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const user = await login(values.email, values.password);
      if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '80vh' }}>
      <Col xs={22} sm={16} md={12} lg={8}>
        {/* === THE FIX IS HERE === */}
        <Card title={<Title level={3}>Member Login</Title>} variant="borderless" style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          {error && <Alert message={error} type="error" showIcon closable style={{ marginBottom: 24 }} />}
          <Form name="login_form" onFinish={onFinish} layout="vertical">
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'The input is not a valid email!' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="e.g., john.doe@example.com" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Your password" size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ width: '100%' }} size="large">
                Log In
              </Button>
            </Form.Item>
            
            <div style={{ textAlign: 'center' }}>
              <span>Don't have an account? </span>
              <a href="/register">Register now</a>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default LoginPage;

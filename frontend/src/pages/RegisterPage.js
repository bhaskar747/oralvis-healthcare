import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Card, Row, Col, Typography } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';

const { Title } = Typography;
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const RegisterPage = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const dataToSend = { ...values, role: 'patient' };
      await axios.post(`${API_URL}/api/auth/register`, dataToSend);
      navigate('/login');
    } catch (err) {
      setError('Registration failed. The email might already be in use.');
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '80vh' }}>
      <Col xs={22} sm={16} md={12} lg={8}>
        {/* === THE FIX IS HERE === */}
        <Card title={<Title level={3}>Create Your Account</Title>} variant="borderless" style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          {error && <Alert message={error} type="error" showIcon closable style={{ marginBottom: 24 }} />}
          <Form name="register_form" onFinish={onFinish} layout="vertical" scrollToFirstError>
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: 'Please input your name!', whitespace: true }]}
            >
              <Input prefix={<UserOutlined />} placeholder="e.g., John Doe" size="large" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { type: 'email', message: 'The input is not a valid email!' },
                { required: true, message: 'Please input your email!' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="e.g., john.doe@example.com" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              hasFeedback
              rules={[{ required: true, message: 'Please create a password!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Create a strong password" size="large" />
            </Form.Item>

            <Form.Item
              name="confirm"
              label="Confirm Password"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Re-type your password" size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ width: '100%' }} size="large">
                Register
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <span>Already have an account? </span>
              <a href="/login">Log in</a>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default RegisterPage;

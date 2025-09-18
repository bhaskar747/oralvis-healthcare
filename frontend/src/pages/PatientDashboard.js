import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  App, // Import the App component to use its context hook
  Layout,
  Typography,
  Form,
  Input,
  Button,
  Upload,
  Table,
  Tag,
  Row,
  Col,
  Card,
} from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PatientDashboard = () => {
  const { user, token } = useAuth();
  const { message } = App.useApp(); // Modern hook for pop-up messages
  const [form] = Form.useForm();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);

  const fetchSubmissions = useCallback(async () => {
    setTableLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/submissions/patient/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(data);
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
      message.error("Could not load your submissions.");
    } finally {
      setTableLoading(false);
    }
  }, [token, message]);

  useEffect(() => {
    if (token) {
      fetchSubmissions();
    }
  }, [token, fetchSubmissions]);

  const onFinish = async (values) => {
    // Correctly get the file from the Form's values
    if (!values.upload || !values.upload[0] || !values.upload[0].originFileObj) {
      message.error("Please select an image file to upload.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    
    // --- THIS IS THE FIX ---
    // Append data securely from the authenticated user context
    formData.append('name', user.name);
    formData.append('email', user.email);
    formData.append('note', values.note || '');
    // Correctly append the file object
    formData.append('image', values.upload[0].originFileObj);

    const key = 'uploading';
    message.loading({ content: 'Uploading image...', key });
    try {
      await axios.post(`${API_URL}/api/submissions/upload`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });
      message.success({ content: 'Upload successful!', key });
      form.resetFields();
      fetchSubmissions(); // Refresh the submissions table
    } catch (err) {
      message.error({ content: 'Upload failed. Please try again.', key });
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };
  
  const columns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'geekblue';
        if (status === 'processed') color = 'green';
        if (status === 'rejected') color = 'volcano';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Report',
      key: 'report',
      dataIndex: 'reportUrl',
      render: (reportUrl) =>
        reportUrl ? (
          <a href={reportUrl} target="_blank" rel="noopener noreferrer" download>
            <Button icon={<DownloadOutlined />} type="primary">
              Download
            </Button>
          </a>
        ) : (
          'Not available'
        ),
    },
  ];

  return (
    <Layout>
      <Title level={2}>Welcome, {user?.name || 'Patient'}</Title>
      <Paragraph>Submit a new dental image for evaluation or view the status of your previous submissions.</Paragraph>
      
      <Row gutter={[32, 32]}>
        <Col xs={24} lg={8}>
          <Card title="New Submission">
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item
                name="upload"
                label="Dental Image"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                rules={[{ required: true, message: 'Please upload an image!' }]}
              >
                <Upload.Dragger 
                  name="file"
                  listType="picture"
                  maxCount={1}
                  beforeUpload={() => false}
                >
                  <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                  <p className="ant-upload-text">Click or drag file to this area to upload</p>
                  <p className="ant-upload-hint">Supports a single upload (PNG or JPG).</p>
                </Upload.Dragger>
              </Form.Item>
              <Form.Item name="note" label="Notes (Optional)">
                <TextArea rows={4} placeholder="Add any relevant notes for the professional..."/>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
                  Submit for Evaluation
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="My Submissions">
            <Table
              columns={columns}
              dataSource={submissions}
              rowKey="_id"
              loading={tableLoading}
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};

export default PatientDashboard;

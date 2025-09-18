import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Layout, Typography, Table, Tag, Button, Input, Space } from 'antd';
import { EditOutlined, SearchOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { Search } = Input;
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminDashboard = () => {
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  // Fetch all submissions from the API
  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/submissions/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllSubmissions(response.data);
      setFilteredSubmissions(response.data); // Initialize filtered list
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchSubmissions();
    }
  }, [token, fetchSubmissions]);

  // Handle search functionality
  const handleSearch = (value) => {
    const lowercasedValue = value.toLowerCase();
    const filtered = allSubmissions.filter(sub =>
      sub.patientDetails.name.toLowerCase().includes(lowercasedValue) ||
      sub.patientDetails.email.toLowerCase().includes(lowercasedValue)
    );
    setFilteredSubmissions(filtered);
  };
  
  // Define columns for the Ant Design Table
  const columns = [
    {
      title: 'Patient Name',
      dataIndex: ['patientDetails', 'name'],
      key: 'name',
      sorter: (a, b) => a.patientDetails.name.localeCompare(b.patientDetails.name),
    },
    {
      title: 'Email',
      dataIndex: ['patientDetails', 'email'],
      key: 'email',
    },
    {
      title: 'Date Submitted',
      dataIndex: 'createdAt',
      key: 'date',
      render: (text) => new Date(text).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'geekblue'; // Default for 'pending'
        if (status === 'processed') color = 'green';
        if (status === 'rejected') color = 'volcano';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Processed', value: 'processed' },
        { text: 'Rejected', value: 'rejected' },
      ],
      onFilter: (value, record) => record.status.indexOf(value) === 0,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Link to={`/annotate/${record._id}`}>
          <Button type="primary" icon={<EditOutlined />}>
            Annotate
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <Layout>
      <Title level={2}>Administrator Dashboard</Title>
      <Paragraph>Review, manage, and annotate all patient submissions.</Paragraph>
      
      <Search
        placeholder="Search by patient name or email"
        onSearch={handleSearch}
        onChange={(e) => handleSearch(e.target.value)} // Live search
        style={{ width: 400, marginBottom: 24 }}
        enterButton
      />
      
      <Table
        columns={columns}
        dataSource={filteredSubmissions}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Layout>
  );
};

export default AdminDashboard;

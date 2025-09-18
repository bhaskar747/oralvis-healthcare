import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Stage, Layer, Image as KonvaImage, Rect, Circle, Arrow } from 'react-konva';
import useImage from 'use-image';
import {
  App,
  Layout,
  Typography,
  Button,
  Row,
  Col,
  Card,
  Spin,
  Space,
} from 'antd';
import {
  BorderOutlined,
  GatewayOutlined, // Corrected icon for Circle
  ArrowRightOutlined,
  ClearOutlined,
  SaveOutlined,
  FilePdfOutlined,
  StopOutlined, // Icon for the new Reject button
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const dataURLtoFile = (dataurl, filename) => {
  let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){ u8arr[n] = bstr.charCodeAt(n); }
  return new File([u8arr], filename, {type:mime});
};

const AnnotationPage = () => {
    const { message } = App.useApp();
    const { submissionId } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [image] = useImage(submission?.originalImageUrl, 'Anonymous');
    const [tool, setTool] = useState('Rect');
    const [annotations, setAnnotations] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    
    const stageRef = useRef(null);
    const containerRef = useRef(null);
    const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && image) {
                const containerWidth = containerRef.current.offsetWidth;
                const scale = containerWidth / image.width;
                setStageSize({
                    width: containerWidth,
                    height: image.height * scale,
                });
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [image]);

    const fetchSubmission = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/api/submissions/${submissionId}`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            setSubmission(data);
            if (data.annotations && typeof data.annotations === 'string') {
                setAnnotations(JSON.parse(data.annotations));
            }
        } catch (error) {
            console.error("Failed to fetch submission:", error);
            message.error('Failed to load submission data.');
        } finally {
            setLoading(false);
        }
    }, [submissionId, token, message]);

    useEffect(() => {
        if (token) fetchSubmission();
    }, [token, fetchSubmission]);

    const handleMouseDown = (e) => {
        if (e.target.className === 'Image') {
            setIsDrawing(true);
            const pos = e.target.getStage().getPointerPosition();
            setAnnotations([...annotations, { tool, points: [pos.x, pos.y, pos.x, pos.y], id: Date.now() }]);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        let lastAnnotation = annotations[annotations.length - 1];
        if (lastAnnotation) {
            lastAnnotation.points = [lastAnnotation.points[0], lastAnnotation.points[1], point.x, point.y];
            setAnnotations(annotations.slice(0, -1).concat(lastAnnotation));
        }
    };
    
    const handleMouseUp = () => setIsDrawing(false);

    const handleSaveAnnotation = async () => {
        if (!stageRef.current) return false;
        const key = 'saving';
        message.loading({ content: 'Saving annotations...', key });
        
        const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
        const imageFile = dataURLtoFile(dataURL, `annotated-${submissionId}.png`);

        const formData = new FormData();
        formData.append('annotations', JSON.stringify(annotations));
        formData.append('annotatedImage', imageFile);

        try {
            await axios.put(`${API_URL}/api/submissions/${submissionId}/annotate`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            message.success({ content: 'Annotations saved successfully!', key });
            return true;
        } catch (error) {
            console.error("Failed to save annotations:", error);
            message.error({ content: 'Failed to save annotations.', key });
            return false;
        }
    };

    const handleGeneratePdf = async () => {
        const saved = await handleSaveAnnotation();
        if (!saved) {
            message.warning('Could not generate PDF because annotations failed to save.');
            return;
        }
        const key = 'generating';
        message.loading({ content: 'Generating PDF report...', key });
        try {
            await axios.post(`${API_URL}/api/submissions/${submissionId}/generate-pdf`, {}, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            message.success({ content: 'PDF report generated and saved!', key });
            navigate('/admin-dashboard');
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            message.error({ content: 'Failed to generate PDF report.', key });
        }
    };

    // --- NEW FUNCTION TO HANDLE REJECTION ---
    const handleReject = async () => {
        const key = 'rejecting';
        message.loading({ content: 'Rejecting submission...', key });
        try {
            await axios.patch(`${API_URL}/api/submissions/${submissionId}/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            message.success({ content: 'Submission has been rejected.', key });
            navigate('/admin-dashboard');
        } catch (error) {
            console.error("Failed to reject submission:", error);
            message.error({ content: 'Failed to reject submission.', key });
        }
    };

    if (loading || !submission) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Spin size="large" tip="Loading Submission..." />
            </div>
        );
    }

    return (
        <Layout>
            <Title level={3}>Annotating Submission for: {submission.patientDetails.name}</Title>
            <Row gutter={[24, 24]}>
                <Col xs={24} md={6}>
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Card title="Annotation Tools">
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Button block icon={<BorderOutlined />} type={tool === 'Rect' ? 'primary' : 'default'} onClick={() => setTool('Rect')}>Rectangle</Button>
                                <Button block icon={<GatewayOutlined />} type={tool === 'Circle' ? 'primary' : 'default'} onClick={() => setTool('Circle')}>Circle</Button>
                                <Button block icon={<ArrowRightOutlined />} type={tool === 'Arrow' ? 'primary' : 'default'} onClick={() => setTool('Arrow')}>Arrow</Button>
                                <Button block danger icon={<ClearOutlined />} onClick={() => setAnnotations([])}>Clear All</Button>
                            </Space>
                        </Card>
                        <Card title="Patient Details">
                            <Text strong>Patient Note:</Text>
                            <Paragraph>{submission.patientDetails.note || 'No note provided.'}</Paragraph>
                        </Card>
                        <Card title="Final Actions">
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Button block danger icon={<StopOutlined />} onClick={handleReject}>Reject Submission</Button>
                                <Button block icon={<SaveOutlined />} onClick={handleSaveAnnotation}>Save Progress</Button>
                                <Button block type="primary" icon={<FilePdfOutlined />} onClick={handleGeneratePdf}>Generate PDF Report</Button>
                            </Space>
                        </Card>
                    </Space>
                </Col>
                <Col xs={24} md={18} ref={containerRef}>
                    <div style={{ border: '1px solid #d9d9d9', borderRadius: '2px', overflow: 'hidden' }}>
                        <Stage
                            width={stageSize.width}
                            height={stageSize.height}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            ref={stageRef}
                        >
                            <Layer>
                                <KonvaImage
                                    image={image}
                                    width={stageSize.width}
                                    height={stageSize.height}
                                />
                                {annotations.map((ann) => {
                                    const [x1, y1, x2, y2] = ann.points;
                                    if (ann.tool === 'Rect') {
                                        return <Rect key={ann.id} x={x1} y={y1} width={x2 - x1} height={y2 - y1} stroke="red" strokeWidth={3} />;
                                    }
                                    if (ann.tool === 'Circle') {
                                        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 2;
                                        return <Circle key={ann.id} x={(x1 + x2) / 2} y={(y1 + y2) / 2} radius={radius} stroke="blue" strokeWidth={3} />;
                                    }
                                    if (ann.tool === 'Arrow') {
                                        return <Arrow key={ann.id} points={ann.points} stroke="green" strokeWidth={3} fill="green" pointerLength={10} pointerWidth={10} />;
                                    }
                                    return null;
                                })}
                            </Layer>
                        </Stage>
                    </div>
                </Col>
            </Row>
        </Layout>
    );
};

export default AnnotationPage;

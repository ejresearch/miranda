import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../../services/api-fixed.js';

export default function FixedProjectDashboard() {
    const { projectName } = useParams();
    const [buckets, setBuckets] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadProjectData();
    }, [projectName]);

    const loadProjectData = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Load buckets
            try {
                const bucketData = await apiService.listBuckets(projectName);
                setBuckets(bucketData.buckets || []);
            } catch (err) {
                console.warn('Could not load buckets:', err);
            }
            
            // Load tables
            try {
                const tableData = await apiService.listTables(projectName);
                setTables(tableData.tables || []);
            } catch (err) {
                console.warn('Could not load tables:', err);
            }
            
        } catch (err) {
            setError(`Failed to load project data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBucket = async () => {
        const bucketName = prompt('Enter bucket name:');
        if (bucketName) {
            try {
                await apiService.createBucket(projectName, bucketName);
                await loadProjectData(); // Refresh
                alert('Bucket created successfully!');
            } catch (err) {
                alert(`Failed to create bucket: ${err.message}`);
            }
        }
    };

    const handleFileUpload = async (bucketName) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await apiService.uploadDocument(projectName, bucketName, file);
                    alert('File uploaded successfully!');
                    await loadProjectData(); // Refresh
                } catch (err) {
                    alert(`Failed to upload file: ${err.message}`);
                }
            }
        };
        fileInput.click();
    };

    const handleGenerateBrainstorm = async () => {
        const prompt = prompt('Enter brainstorm prompt:');
        if (prompt) {
            try {
                const result = await apiService.generateBrainstorm(projectName, {
                    prompt: prompt,
                    selectedBuckets: buckets.map(b => b.name),
                    tone: 'creative'
                });
                alert('Brainstorm generated! Check console for results.');
                console.log('Brainstorm result:', result);
            } catch (err) {
                alert(`Failed to generate brainstorm: ${err.message}`);
            }
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Fixed Project Dashboard: {projectName}</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                    <h2>Document Buckets ({buckets.length})</h2>
                    <button onClick={handleCreateBucket}>Create Bucket</button>
                    {buckets.map((bucket, index) => (
                        <div key={index} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px' }}>
                            <strong>{bucket.name || `Bucket ${index + 1}`}</strong>
                            <button onClick={() => handleFileUpload(bucket.name)}>Upload File</button>
                        </div>
                    ))}
                </div>
                
                <div>
                    <h2>Data Tables ({tables.length})</h2>
                    {tables.map((table, index) => (
                        <div key={index} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px' }}>
                            <strong>{table.name || `Table ${index + 1}`}</strong>
                            <div>Rows: {table.row_count || 0}</div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div style={{ marginTop: '20px' }}>
                <button onClick={handleGenerateBrainstorm}>Generate Brainstorm</button>
                <button onClick={() => window.open(`/projects/${projectName}/export/json`)}>Export JSON</button>
            </div>
        </div>
    );
}

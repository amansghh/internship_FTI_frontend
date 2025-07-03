import {useState} from 'react';
import axios from 'axios';
import {toast} from 'react-toastify';

const AccessPanel = ({apiKey, setApiKey, fti, setFti}) => {
    const [data, setData] = useState(null);

    const fetchData = async () => {
        try {
            const res = await axios.get('http://localhost:8000/list', {
                params: {fti},
                headers: {'api-key': apiKey || ''}
            });
            setData(res.data.functionalities);
            toast.success(`Fetched ${fti ? 'FTI-compatible' : 'Standard'} features!`);
        } catch (err) {
            const msg = err.response?.data?.detail || "Unknown error";
            toast.error(`❌ ${msg}`);
            setData(null);
        }
    };

    return (
        <>
            <h1>Access Panel</h1>
            <p className="subtitle">
                Request secure access to standard or FTI-compatible functionalities through your API key.
            </p>

            <div className="input-group">
                <label>API Key</label>
                <input
                    placeholder="Enter your API key (e.g. key_fti)"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                />
            </div>

            <div className="checkbox">
                <input
                    type="checkbox"
                    checked={fti}
                    onChange={e => setFti(e.target.checked)}
                />
                <label>Enable FTI Mode</label>
            </div>

            <button onClick={fetchData}>Fetch Functionalities</button>

            {data && data.length > 0 ? (
                <div className="features-grid">
                    {data.map((func, i) => (
                        <div key={i} className="feature-card">
                            <h3>{func.name.replace(/_/g, ' ')}</h3>
                            <p>{func.description}</p>
                            <code>{func.method} {func.endpoint}</code>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="results">No functionalities available.</div>
            )}
        </>
    );
};

export default AccessPanel;

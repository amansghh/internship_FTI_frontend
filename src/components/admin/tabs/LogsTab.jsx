import React, {useState, useEffect} from 'react';

const LogsTab = ({logs, fetchLogs}) => {
    const [filtered, setFiltered] = useState([]);
    const [endpointFilter, setEndpointFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [revealKeys, setRevealKeys] = useState(false);

   useEffect(() => {
        // Filtering only (no fetching here)
        let result = logs;

        if (endpointFilter) result = result.filter(l => l.endpoint === endpointFilter);
        if (startDate) result = result.filter(l => new Date(l.timestamp) >= new Date(startDate));
        if (endDate) result = result.filter(l => new Date(l.timestamp) <= new Date(endDate));

        setFiltered(result);
    }, [endpointFilter, startDate, endDate, logs]);

    const uniqueEndpoints = [...new Set(logs.map(l => l.endpoint))];

    return (
        <>
            <div className="filters">
                <label>
                    Filter by Endpoint:
                    <select value={endpointFilter} onChange={e => setEndpointFilter(e.target.value)}>
                        <option value="">All</option>
                        {uniqueEndpoints.map((ep, i) => <option key={i} value={ep}>{ep}</option>)}
                    </select>
                </label>
                <label>
                    From:
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}/>
                </label>
                <label>
                    To:
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}/>
                </label>
            </div>

            <div className="key-toggle">
                <button onClick={() => setRevealKeys(!revealKeys)}>
                    {revealKeys ? 'Hide API Keys' : 'Show API Keys'}
                </button>
            </div>

            <div className="logs-scroll-box">
                <table className="logs-table">
                    <thead>
                    <tr>
                        <th>Endpoint</th>
                        <th>IP Address</th>
                        <th>Timestamp</th>
                        <th>API Key</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.map((log, i) => (
                        <tr key={i}>
                            <td>{log.endpoint}</td>
                            <td>{log.ip_address}</td>
                            <td>{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="truncate">
                                <span className="fixed-width">
                                    {revealKeys ? log.api_key : '•'.repeat(log.api_key.length)}
                                </span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default LogsTab;

import React from 'react';

const ListKeys = ({fetchKeys, listedKeys}) => {
    return (
        <>
            <div className="key-controls">
                <button onClick={fetchKeys}>🔄 Fetch Keys</button>
            </div>
            <table className="logs-table">
                <thead>
                <tr>
                    <th>Key</th>
                    <th>Role</th>
                    <th>Active</th>
                    <th>Created</th>
                    <th>Expires</th>
                </tr>
                </thead>
                <tbody>
                {listedKeys.map((k, i) => (
                    <tr key={i}>
                        <td className="truncate"><span className="fixed-width">{k.key}</span></td>
                        <td>{k.role}</td>
                        <td>{k.active ? 'Yes' : 'No'}</td>
                        <td>{new Date(k.created_at).toLocaleString()}</td>
                        <td>{k.expires_at ? new Date(k.expires_at).toLocaleString() : 'Never'}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </>
    );
};

export default ListKeys;

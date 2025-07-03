import React, {useEffect, useState} from 'react';
import {toast} from 'react-toastify';
import AuthBox from './AuthBoxAdmin.jsx';
import {useAdminActions} from '../../hooks/useAdminActions';
import CreateKey from '../../components/admin/tabs/CreateKey';
import ListKeys from '../../components/admin/tabs/ListKeys';
import DeactivateKey from '../../components/admin/tabs/DeactivateKey';
import RegisterTool from '../../components/admin/tabs/RegisterTool';
import LogsTab from '../../components/admin/tabs/LogsTab';
import '../../assets/css/AdminPage.css';

const AdminPage = () => {
    const [adminKey, setAdminKey] = useState('');
    const [accessGranted, setAccessGranted] = useState(false);
    const [tab, setTab] = useState(null);

    const {
        listedKeys,
        logs,
        createKey,
        fetchKeys,
        deactivateKey,
        registerNewTool,
        fetchLogs,
    } = useAdminActions(adminKey);

    useEffect(() => {
        if (tab === 'logs' && logs.length === 0) {
            fetchLogs();
        }
    }, [tab]);


    const renderTab = () => {
        switch (tab) {
            case 'create':
                return <CreateKey createKey={createKey}/>;
            case 'list':
                return <ListKeys fetchKeys={fetchKeys} listedKeys={listedKeys}/>;
            case 'deactivate':
                return <DeactivateKey deactivateKey={deactivateKey}/>;
            case 'register':
                return <RegisterTool registerNewTool={registerNewTool}/>;
            case 'logs':
                return <LogsTab logs={logs} fetchLogs={fetchLogs}/>;
            default:
                return null;
        }
    };

    if (!accessGranted) {
        return (
            <AuthBox
                onSubmit={(key) => {
                    setAdminKey(key);
                    setAccessGranted(true);
                    setTab('create');
                    toast.success("Access granted");
                }}
            />
        );
    }

    return (
        <div className="logs-container">
            <h2 className="logs-header">Admin Panel</h2>
            <div className="admin-tabs">
                {['create', 'list', 'deactivate', 'register', 'logs'].map((key) => (
                    <div
                        key={key}
                        className={`tab ${tab === key ? 'active' : ''}`}
                        onClick={() => setTab(key)}
                    >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                    </div>
                ))}
            </div>
            <div className="admin-tab-content">{renderTab()}</div>
        </div>
    );
};

export default AdminPage;

import {useState} from 'react';
import './assets/css/App.css';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminPage from './components/admin/AdminPage.jsx';
import AccessPanel from './components/mcp/AccessPanel.jsx';
import Sidebar from './components/layout/Sidebar.jsx';

function App() {
    const [apiKey, setApiKey] = useState('');
    const [fti, setFti] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("access");

    const renderMain = () => {
        if (activeTab === "admin") return <AdminPage/>;
        return <AccessPanel apiKey={apiKey} setApiKey={setApiKey} fti={fti} setFti={setFti}/>;
    };

    return (
        <div className="grid-layout">
            <header className="topbar">
                <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
                <div className="topbar-logo-container">
                    <img src="/fti-v-logo-footer.svg" alt="FTI Logo" className="topbar-logo"/>
                </div>
            </header>

            <Sidebar open={sidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab}/>

            <main className="main-content">
                <div className="app-container">{renderMain()}</div>
            </main>

            <ToastContainer position="top-right" autoClose={3000}/>
        </div>
    );
}

export default App;

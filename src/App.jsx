import './assets/css/App.css';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminPage from './components/admin/AdminPage.jsx';
import AccessPanel from './components/mcp/AccessPanel.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import {McpProvider} from "./context/McpContext.jsx";
import MCPPage from "./components/mcp/mcp/MCPPage.jsx";
import {useState, useEffect} from 'react';
import SecureFilePage from "./components/secure/SecureFilePage.jsx";

function App() {
    const [apiKey, setApiKey] = useState('');
    const [fti, setFti] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTabState] = useState(() => {
        return sessionStorage.getItem("activeTab") || "access";
    });

    const setActiveTab = (tab) => {
        setActiveTabState(tab);
        sessionStorage.setItem("activeTab", tab);
    };
    const renderMain = () => {
        if (activeTab === "admin") return <AdminPage/>;
        if (activeTab === "mcp") return <MCPPage/>;
        if (activeTab === "secure-file") return <SecureFilePage />;
        return <AccessPanel/>;
    };


    return (
        <McpProvider>
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
        </McpProvider>
    );
}

export default App;

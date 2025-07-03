import React from 'react';
import '../../assets/css/App.css';

const Sidebar = ({open, activeTab, setActiveTab}) => {
    return (
        <aside className={`sidebar ${open ? 'open' : ''}`}>
            <div className="sidebar-header">
                <img src="/fti-v-logo-footer.svg" alt="FTI" className="sidebar-logo"/>
                <h2 className="sidebar-title">FTI Suite</h2>
            </div>
            <nav>
                <div className="sidebar-section">Main</div>
                <ul>
                    <li className={activeTab === "access" ? "active" : ""}
                        onClick={() => setActiveTab("access")}>Access Panel
                    </li>
                    <li className={activeTab === "admin" ? "active" : ""}
                        onClick={() => setActiveTab("admin")}>Admin Panel
                    </li>
                    <li>LLM Process (soon)</li>
                    <li>Secure Transfer (soon)</li>
                </ul>
                <div className="sidebar-section">Resources</div>
                <ul>
                    <li>Documentation</li>
                    <li>Support</li>
                    <li>Release Notes</li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;

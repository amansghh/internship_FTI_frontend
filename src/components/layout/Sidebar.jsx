import React, {useState} from 'react';
import '../../assets/css/App.css';
import {useMcpContext} from '../../context/McpContext';

const Sidebar = ({open, activeTab, setActiveTab}) => {
    const {initialized, fti} = useMcpContext();
    const [accessOpen, setAccessOpen] = useState(true);

    const ftiEnabled = initialized && fti;

    return (
        <aside className={`sidebar ${open ? 'open' : ''}`}>
            <div className="sidebar-header">
                <img src="/fti-v-logo-footer.svg" alt="FTI" className="sidebar-logo"/>
                <h2 className="sidebar-title">FTI Suite</h2>
            </div>

            <nav>
                <div className="sidebar-section">Main</div>
                <ul>
                    <li
                        className={activeTab === "access" ? "active" : ""}
                        onClick={() => {
                            if (activeTab !== "access") setActiveTab("access");
                            else setAccessOpen(prev => !prev); // toggle only when already on access panel
                        }}
                    >
                        <span className={`arrow ${accessOpen ? 'rotated' : ''}`}>▶</span> Access Panel
                    </li>


                    {/* Accordion content only shown when initialized */}
                    {initialized && accessOpen && (
                        <ul style={{marginLeft: '16px', marginTop: '6px'}}>
                            <li
                                className={activeTab === "mcp" ? "active" : ""}
                                onClick={() => setActiveTab("mcp")}
                            >
                                MCP Page
                            </li>
                        </ul>
                    )}

                    <li
                        className={activeTab === "admin" ? "active" : ""}
                        onClick={() => setActiveTab("admin")}
                    >
                        Admin Panel
                    </li>

                    {/* ✅ Secure File with animated tooltip */}
                    <li
                        className={`secure-file-entry ${
                            activeTab === "secure-file"
                                ? ftiEnabled ? "active" : "disabled active"
                                : ftiEnabled ? "" : "disabled"
                        }`}
                        onClick={() => ftiEnabled && setActiveTab("secure-file")}
                    >
                        <div className="tooltip-wrapper">
                            Secure File
                            {!ftiEnabled && (
                                <div className="custom-tooltip">
                                    🔒 Requires FTI mode to be initialized in Access Panel
                                </div>
                            )}
                        </div>
                    </li>

                    <li
                        className={activeTab === "sse-test" ? "active" : ""}
                        onClick={() => setActiveTab("sse-test")}
                    >
                        SSE Stream
                    </li>
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

import React, {useState} from 'react';
import '../../assets/css/App.css';
import {useMcpContext} from '../../context/McpContext';

const Sidebar = ({open, activeTab, setActiveTab}) => {
    const {initialized} = useMcpContext();
    const [accessOpen, setAccessOpen] = useState(true);

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
                            setActiveTab("access");
                            setAccessOpen(prev => !prev);
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
                    <li>LLM Process (soon)</li>
                    <li
                        className={activeTab === "secure-file" ? "active" : ""}
                        onClick={() => setActiveTab("secure-file")}
                    >
                        Secure File
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

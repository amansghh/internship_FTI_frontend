import React, {useEffect, useState} from 'react';
import ToolsTab from './tabs/ToolsTab';
import PromptsTab from './tabs/PromptsTab';
import LlmTab from './tabs/LlmTab';
import ResourcesTab from './tabs/ResourcesTab';
import '../../../assets/css/MCPPage.css';
import RateLimitBanner from '../../../components/RateLimitBanner.jsx';
import {useRateLimit} from '../../../context/RateLimitContext.jsx';

const TABS = ['Tools', 'Prompts', 'LLM', 'Resources'];
const STORAGE_TAB = 'mcp-active-tab';

const MCPPage = () => {
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem(STORAGE_TAB) || 'Tools');
    const [activeRefetch, setActiveRefetch] = useState(null);
    const {rate} = useRateLimit();

    useEffect(() => localStorage.setItem(STORAGE_TAB, activeTab), [activeTab]);

    const renderTabContent = () => {
        const register = (fn) => setActiveRefetch(() => fn || null);
        switch (activeTab) {
            case 'Tools':
                return <ToolsTab setRefetch={register}/>;
            case 'Prompts':
                return <PromptsTab setRefetch={register}/>;
            case 'LLM':
                return <LlmTab setRefetch={register}/>;
            case 'Resources':
                return <ResourcesTab setRefetch={register}/>;
            default:
                return null;
        }
    };

    return (
        <div className="mcp-page">
            <h2 className="mcp-title">Model Context Protocol (MCP)</h2>

            <div className="mcp-tabs">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        className={`mcp-tab ${tab === activeTab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>


            {/* 🚫 Hide global banner while on the LLM tab */}
            {rate && activeTab !== 'LLM' && (
                <RateLimitBanner
                    message={rate.message}
                    until={rate.until}
                    onRetry={() => activeRefetch && activeRefetch()}
                />
            )}

            <div className="mcp-tab-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default MCPPage;

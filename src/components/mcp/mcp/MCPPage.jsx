import React, {useState} from 'react';
import ToolsTab from './tabs/ToolsTab';
import PromptsTab from './tabs/PromptsTab';
import LlmTab from './tabs/LlmTab';
import ResourcesTab from './tabs/ResourcesTab';
import '../../../assets/css/MCPPage.css';

const TABS = ['Tools', 'Prompts', 'LLM', 'Resources'];

const MCPPage = () => {
    const [activeTab, setActiveTab] = useState('Tools');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Tools':
                return <ToolsTab/>;
            case 'Prompts':
                return <PromptsTab/>;
            case 'LLM':
                return <LlmTab/>;
            case 'Resources':
                return <ResourcesTab/>;
            default:
                return null;
        }
    };

    return (
        <div className="mcp-page">
            <h2 className="mcp-title">Model Context Protocol (MCP)</h2>

            <div className="mcp-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        className={`mcp-tab ${tab === activeTab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>


            <div className="mcp-tab-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default MCPPage;

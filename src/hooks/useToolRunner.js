import {useState, useCallback} from 'react';
import {useMcpContext} from '../context/McpContext';
import {callTool} from '../services/toolService';

export const useToolRunner = () => {
    const {apiKey, sessionId, protocolVersion} = useMcpContext();
    const [running, setRunning] = useState(false);
    const [output, setOutput] = useState(null);
    const [error, setError] = useState(null);

    const run = useCallback(
        async (name, args) => {
            setRunning(true);
            setError(null);
            setOutput(null);
            try {
                const res = await callTool(name, args, apiKey, sessionId, protocolVersion);
                setOutput(res);
            } catch (e) {
                setError(e.response?.data?.error?.message || 'Tool call failed');
            } finally {
                setRunning(false);
            }
        },
        [apiKey, sessionId, protocolVersion]
    );

    return {run, running, output, error, setOutput};
};

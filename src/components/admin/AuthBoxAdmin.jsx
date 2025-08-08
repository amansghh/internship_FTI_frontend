import React, {useState} from 'react';
import axios from 'axios';
import {toast} from 'react-toastify';
import '../../assets/css/AuthBox.css';

const AuthBox = ({onSubmit}) => {
    const [adminKey, setAdminKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [checking, setChecking] = useState(false);
    const [success, setSuccess] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);

    const handleSubmit = async () => {
        if (adminKey.length < 5) return;

        setChecking(true);

        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/admin/health`, {
                headers: {'api-key': adminKey}
            });

            if (res.data.status === 'ok' && res.data.role === 'admin') {
                setSuccess(true);

                setTimeout(() => {
                    setFadeOut(true);
                    setTimeout(() => {
                        onSubmit(adminKey);
                    }, 400);
                }, 800);
            } else {
                throw new Error('Not an admin key');
            }
        } catch (err) {
            toast.error(err.response?.data?.detail || "Invalid admin key");
            setChecking(false);
        }
    };

    return (
        <div
            className={`auth-box ${checking ? 'checking' : ''} ${success ? 'success' : ''} ${fadeOut ? 'fade-out' : ''}`}>
            <label>Enter Admin API Key:</label>
            <div className="input-row">
                <input
                    type={showKey ? 'text' : 'password'}
                    value={adminKey}
                    placeholder="Admin API Key"
                    onChange={e => setAdminKey(e.target.value)}
                    disabled={checking}
                />
                <button
                    onClick={() => setShowKey(!showKey)}
                    className="toggle-btn"
                    disabled={checking}
                >
                    {showKey ? 'Hide' : 'Show'}
                </button>
            </div>
            <button
                onClick={handleSubmit}
                className="submit-btn"
                disabled={checking}
            >
                {checking ? <span className="dot-pulse"/> : "Submit"}
            </button>

            {success && <div className="checkmark-animation">✓</div>}
        </div>
    );
};

export default AuthBox;

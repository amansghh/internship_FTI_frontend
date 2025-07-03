import React, {useState} from 'react';

const CreateKey = ({createKey}) => {
    const [role, setRole] = useState('standard');
    const [expires, setExpires] = useState('');
    const [tier, setTier] = useState('basic');

    const handleSubmit = () => {
        createKey({
            role,
            owner: 'admin',
            expires,
            tier
        });
    };

    return (
        <form className="admin-form">
            <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="standard">Standard</option>
                <option value="admin">Admin</option>
                <option value="fti">FTI</option>
            </select>
            <input placeholder="Expiry Date (YYYY-MM-DD)" value={expires} onChange={e => setExpires(e.target.value)}/>
            <select value={tier} onChange={e => setTier(e.target.value)}>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="unlimited">Unlimited</option>
            </select>
            <button type="button" onClick={handleSubmit}>Create Key</button>
        </form>
    );
};

export default CreateKey;

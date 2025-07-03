import React, { useState } from 'react';
import { toast } from 'react-toastify';
import '../../../assets/css/RegisterTool.css';

const VALID_TYPES = ['string', 'integer', 'boolean', 'number', 'object', 'array'];

const RegisterTool = ({ registerNewTool }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [binary, setBinary] = useState(false);
    const [ftiOnly, setFtiOnly] = useState(false);
    const [fields, setFields] = useState([{ key: '', type: '', error: null }]);

    const handleAddField = () => {
        setFields([...fields, { key: '', type: '', error: null }]);
    };

    const handleRemoveField = (index) => {
        const updated = [...fields];
        updated.splice(index, 1);
        setFields(updated);
    };

    const handleChange = (i, field, value) => {
        const updated = [...fields];
        updated[i][field] = value;
        updated[i].error = null;
        setFields(updated);
    };

    const validateFields = () => {
        let valid = true;
        const updated = fields.map(f => {
            if (!f.key || !VALID_TYPES.includes(f.type)) {
                valid = false;
                return { ...f, error: 'Invalid key or type' };
            }
            return { ...f, error: null };
        });
        setFields(updated);
        return valid;
    };

    const buildSchema = () => {
        const schema = {};
        fields.forEach(f => {
            if (f.key && VALID_TYPES.includes(f.type)) {
                schema[f.key] = { type: f.type };
            }
        });
        return schema;
    };

    const handleRegister = () => {
        if (!validateFields()) {
            toast.error('❌ Please fix schema errors before submitting.');
            return;
        }

        const input_schema = buildSchema();

        registerNewTool({
            name,
            description,
            input_schema,
            binary,
            fti_only: ftiOnly,
        });
    };

    return (
        <form className="admin-form">
            <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
            <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />

            <div className="schema-builder">
                <div className="schema-label-row">
                    <label>Input Schema</label>
                    <button type="button" onClick={handleAddField} className="add-btn">+ Field</button>
                </div>

                {fields.map((field, i) => (
                    <div key={i} className={`schema-row ${field.error ? 'has-error' : ''}`}>
                        <input
                            placeholder="Field name"
                            value={field.key}
                            onChange={e => handleChange(i, 'key', e.target.value)}
                        />
                        <select
                            value={field.type}
                            onChange={e => handleChange(i, 'type', e.target.value)}
                        >
                            <option value="">Select type</option>
                            {VALID_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="remove-btn"
                            onClick={() => handleRemoveField(i)}
                            title="Remove field"
                        >
                            &minus;
                        </button>
                        {field.error && <span className="error-msg">⚠</span>}
                    </div>
                ))}
            </div>

            <div className="json-preview">
                <pre>{JSON.stringify(buildSchema(), null, 2)}</pre>
            </div>

            <label>
                <input type="checkbox" checked={binary} onChange={e => setBinary(e.target.checked)} />
                Binary
            </label>
            <label>
                <input type="checkbox" checked={ftiOnly} onChange={e => setFtiOnly(e.target.checked)} />
                FTI Only
            </label>

            <button type="button" onClick={handleRegister}>Register Tool</button>
        </form>
    );
};

export default RegisterTool;

import React, { useState } from 'react';

const DeactivateKey = ({ deactivateKey }) => {
  const [inputKey, setInputKey] = useState('');

  const handleDeactivate = () => {
    deactivateKey(inputKey);
  };

  return (
    <form className="admin-form">
      <input
        placeholder="API Key to Deactivate"
        value={inputKey}
        onChange={e => setInputKey(e.target.value)}
      />
      <button type="button" onClick={handleDeactivate}>Deactivate</button>
    </form>
  );
};

export default DeactivateKey;

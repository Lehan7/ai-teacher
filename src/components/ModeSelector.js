import React from 'react';

export default function ModeSelector({ selectedMode, onModeChange }) {
  return (
    <select value={selectedMode} onChange={onModeChange} className="mode-selector">
      <option value="Interview Mode">Interview Mode</option>
      <option value="Friends Mode">Friends Mode</option>
      <option value="Family Mode">Family Mode</option>
      <option value="Teacher Mode">Teacher Mode</option>
      <option value="Free Chat Mode">Free Chat Mode</option>
    </select>
  );
}

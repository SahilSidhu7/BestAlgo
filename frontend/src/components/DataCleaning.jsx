import { useState } from 'react';
import axios from 'axios';
import { Settings, Download, Trash2 } from 'lucide-react';

export default function DataCleaning({ fileData, onCleanSuccess, onReset }) {
  const [targetColumn, setTargetColumn] = useState('');
  const [mode, setMode] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Manual options
  const [options, setOptions] = useState({
    remove_duplicates: false,
    drop_nans: false,
    fill_nans_mean: false,
    standardize: false,
    normalize: false,
    encode_categorical: false
  });

  const handleOptionChange = (e) => {
    setOptions({ ...options, [e.target.name]: e.target.checked });
  };

  const handleClean = async () => {
    if (!targetColumn) {
      setError('Please select a target column to guess/predict.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        file_id: fileData.file_id,
        target_column: targetColumn,
        mode: mode,
        ...options
      };

      const response = await axios.post('https://sulback.sahilsidhu.pro/api/clean', payload);
      onCleanSuccess(response.data, targetColumn);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to clean data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2><Settings /> Data Optimization</h2>
        <button onClick={onReset} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          <Trash2 size={16} /> Start Over
        </button>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Rows: {fileData.total_rows} | Columns: {fileData.columns.length}
      </p>

      <div className="form-group">
        <label>Target Column (Field to guess/predict)</label>
        <select value={targetColumn} onChange={(e) => setTargetColumn(e.target.value)}>
          <option value="">-- Select Target --</option>
          {fileData.columns.map((col) => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
      </div>

      <div className="form-group" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button
          className={`btn ${mode === 'auto' ? '' : 'btn-secondary'}`}
          onClick={() => setMode('auto')}
          style={{ flex: 1 }}
        >
          Auto Clean
        </button>
        <button
          className={`btn ${mode === 'manual' ? '' : 'btn-secondary'}`}
          onClick={() => setMode('manual')}
          style={{ flex: 1 }}
        >
          Manual Clean
        </button>
      </div>

      {mode === 'manual' && (
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <div className="checkbox-group">
            <input type="checkbox" name="remove_duplicates" checked={options.remove_duplicates} onChange={handleOptionChange} id="rm_dup" />
            <label htmlFor="rm_dup" style={{ margin: 0 }}>Remove Duplicates</label>
          </div>
          <div className="checkbox-group">
            <input type="checkbox" name="drop_nans" checked={options.drop_nans} onChange={handleOptionChange} id="drop_nan" />
            <label htmlFor="drop_nan" style={{ margin: 0 }}>Drop Missing Values (NaNs)</label>
          </div>
          <div className="checkbox-group">
            <input type="checkbox" name="fill_nans_mean" checked={options.fill_nans_mean} onChange={handleOptionChange} id="fill_nan" />
            <label htmlFor="fill_nan" style={{ margin: 0 }}>Fill Numeric Missing Values with Mean</label>
          </div>
          <div className="checkbox-group">
            <input type="checkbox" name="encode_categorical" checked={options.encode_categorical} onChange={handleOptionChange} id="enc_cat" />
            <label htmlFor="enc_cat" style={{ margin: 0 }}>Encode Categorical Variables</label>
          </div>
          <div className="checkbox-group">
            <input type="checkbox" name="standardize" checked={options.standardize} onChange={handleOptionChange} id="std" />
            <label htmlFor="std" style={{ margin: 0 }}>Standardize Numeric Data</label>
          </div>
          <div className="checkbox-group">
            <input type="checkbox" name="normalize" checked={options.normalize} onChange={handleOptionChange} id="norm" />
            <label htmlFor="norm" style={{ margin: 0 }}>Normalize Numeric Data</label>
          </div>
        </div>
      )}

      {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</p>}

      <button className="btn" onClick={handleClean} disabled={loading || !targetColumn}>
        {loading ? 'Optimizing...' : 'Optimize Data'}
      </button>

    </div>
  );
}

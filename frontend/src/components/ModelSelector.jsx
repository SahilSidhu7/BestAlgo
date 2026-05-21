import { useState } from 'react';
import axios from 'axios';
import { Cpu, Download } from 'lucide-react';

const AVAILABLE_MODELS = [
  { name: 'Logistic Regression', type: 'classification', defaultParams: { max_iter: 1000 } },
  { name: 'Decision Tree', type: 'both', defaultParams: { max_depth: 10 } },
  { name: 'Random Forest', type: 'both', defaultParams: { n_estimators: 100 } },
  { name: 'SVM', type: 'classification', defaultParams: { kernel: 'rbf' } },
  { name: 'KNN', type: 'classification', defaultParams: { n_neighbors: 5 } },
  { name: 'Multilinear Regression', type: 'regression', defaultParams: {} },
  { name: 'Polynomial Regression', type: 'regression', defaultParams: { degree: 2 } },
];

export default function ModelSelector({ cleanedData, targetColumn, onTrainSuccess }) {
  const [selectedModels, setSelectedModels] = useState({});
  const [hyperparameters, setHyperparameters] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleModelToggle = (modelName, defaultParams) => {
    setSelectedModels(prev => ({
      ...prev,
      [modelName]: !prev[modelName]
    }));

    // Initialize hyperparameters if selected and not yet present
    if (!selectedModels[modelName] && !hyperparameters[modelName]) {
      setHyperparameters(prev => ({
        ...prev,
        [modelName]: { ...defaultParams }
      }));
    }
  };

  const handleParamChange = (modelName, paramName, value) => {
    setHyperparameters(prev => ({
      ...prev,
      [modelName]: {
        ...prev[modelName],
        [paramName]: value
      }
    }));
  };

  const handleTrain = async () => {
    const modelsToTrain = Object.keys(selectedModels).filter(m => selectedModels[m]);
    if (modelsToTrain.length === 0) {
      setError('Please select at least one model.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        file_id: cleanedData.cleaned_file_id,
        target_column: targetColumn,
        models: modelsToTrain,
        hyperparameters: hyperparameters
      };

      const response = await axios.post('https://sulback.sahilsidhu.pro/api/train', payload);
      onTrainSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Training failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.location.href = `https://sulback.sahilsidhu.pro/api/download/${cleanedData.cleaned_file_id}`;
  };

  return (
    <div className="glass-card fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2><Cpu /> Model Selection</h2>
        <button onClick={handleDownload} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          <Download size={16} /> Download Cleaned Data
        </button>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Select the models you want to train and compare. Fill in the required hyperparameters.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {AVAILABLE_MODELS.filter(m => m.type === 'both' || !cleanedData.task_type || m.type === cleanedData.task_type).map(model => (
          <div key={model.name} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
            <div className="checkbox-group" style={{ marginBottom: selectedModels[model.name] ? '1rem' : '0' }}>
              <input
                type="checkbox"
                id={model.name}
                checked={selectedModels[model.name] || false}
                onChange={() => handleModelToggle(model.name, model.defaultParams)}
              />
              <label htmlFor={model.name} style={{ margin: 0, fontWeight: 600 }}>{model.name}</label>
            </div>

            {selectedModels[model.name] && Object.keys(model.defaultParams).map(param => (
              <div key={param} style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                  {param}
                </label>
                <input
                  type={typeof model.defaultParams[param] === 'number' ? 'number' : 'text'}
                  value={hyperparameters[model.name]?.[param] || ''}
                  onChange={(e) => handleParamChange(model.name, param, e.target.value)}
                  required
                  style={{ padding: '0.5rem' }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</p>}

      <button className="btn" onClick={handleTrain} disabled={loading}>
        {loading ? 'Training Models...' : 'Run Models & Compare'}
      </button>
    </div>
  );
}

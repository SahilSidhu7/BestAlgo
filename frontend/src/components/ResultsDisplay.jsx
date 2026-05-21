import { useState } from 'react';
import { BarChart, Activity, Minimize2 } from 'lucide-react';

export default function ResultsDisplay({ results }) {
  const { task_type, results: modelResults } = results;
  const models = Object.keys(modelResults);
  const [expandedModel, setExpandedModel] = useState(null);

  const formatNumber = (num) => {
    if (typeof num !== 'number') return num;
    return num.toFixed(4);
  };

  const renderMetrics = (modelName) => {
    const metrics = modelResults[modelName];
    if (task_type === 'classification') {
      return (
        <div className="results-grid">
          <div className="metric-card">
            <h4>Accuracy</h4>
            <p>{formatNumber(metrics.accuracy)}</p>
          </div>
          <div className="metric-card">
            <h4>F1 Score</h4>
            <p>{formatNumber(metrics.f1_score)}</p>
          </div>
          <div className="metric-card">
            <h4>Precision</h4>
            <p>{formatNumber(metrics.precision)}</p>
          </div>
          <div className="metric-card">
            <h4>Recall</h4>
            <p>{formatNumber(metrics.recall)}</p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="results-grid">
          <div className="metric-card">
            <h4>Mean Squared Error</h4>
            <p>{formatNumber(metrics.mse)}</p>
          </div>
          <div className="metric-card">
            <h4>Mean Abs. Error</h4>
            <p>{formatNumber(metrics.mae)}</p>
          </div>
          <div className="metric-card">
            <h4>R2 Score</h4>
            <p>{formatNumber(metrics.r2)}</p>
          </div>
        </div>
      );
    }
  };

  const renderConfusionMatrix = (matrix) => {
    return (
      <div style={{ marginTop: '1.5rem' }}>
        <h4>Confusion Matrix</h4>
        <div className="table-container">
          <table>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ textAlign: 'center', background: `rgba(99, 102, 241, ${Math.min(cell / 10, 0.5)})` }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card fade-in" id="results-section">
      <h2 style={{ marginBottom: '1.5rem' }}><Activity /> Comparison Results</h2>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textTransform: 'capitalize' }}>
        Task Type Detected: <strong>{task_type}</strong>
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {models.map(model => (
          <div
            key={model}
            style={{
              background: 'var(--surface-color)',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--surface-border)',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onClick={() => setExpandedModel(model)}
            className="hover-scale"
          >
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>{model}</h3>
            {renderMetrics(model)}
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '1rem', textAlign: 'right' }}>
              Click to expand details
            </p>
          </div>
        ))}
      </div>

      {expandedModel && (
        <div className="modal-overlay" onClick={() => setExpandedModel(null)}>
          <div className="modal-content fade-in" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setExpandedModel(null)}><Minimize2 /></button>
            <h2 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{expandedModel} Details</h2>

            {renderMetrics(expandedModel)}

            {task_type === 'classification' && modelResults[expandedModel].confusion_matrix && (
              renderConfusionMatrix(modelResults[expandedModel].confusion_matrix)
            )}
          </div>
        </div>
      )}

      <style>{`
        .hover-scale:hover {
          transform: scale(1.01);
          border-color: var(--primary-color);
        }
      `}</style>
    </div>
  );
}

import { useState } from 'react';
import FileUpload from './components/FileUpload';
import DataCleaning from './components/DataCleaning';
import ModelSelector from './components/ModelSelector';
import ResultsDisplay from './components/ResultsDisplay';

function App() {
  const [fileData, setFileData] = useState(null);
  const [cleanedData, setCleanedData] = useState(null);
  const [targetColumn, setTargetColumn] = useState('');
  const [trainResults, setTrainResults] = useState(null);

  const resetAll = () => {
    setFileData(null);
    setCleanedData(null);
    setTargetColumn('');
    setTrainResults(null);
  };

  return (
    <div className="app-container fade-in">
      <header className="header">
        <h1>Data Optimizer & ML Hub</h1>
        <p>Upload, Clean, Train, and Compare Models seamlessly.</p>
      </header>

      {!fileData && (
        <FileUpload onUploadSuccess={setFileData} />
      )}

      {fileData && !cleanedData && (
        <DataCleaning
          fileData={fileData}
          onCleanSuccess={(data, targetCol) => {
            setCleanedData(data);
            setTargetColumn(targetCol);
          }}
          onReset={resetAll}
        />
      )}

      {cleanedData && !trainResults && (
        <ModelSelector
          cleanedData={cleanedData}
          targetColumn={targetColumn}
          onTrainSuccess={setTrainResults}
        />
      )}

      {trainResults && (
        <ResultsDisplay results={trainResults} />
      )}
    </div>
  );
}

export default App;
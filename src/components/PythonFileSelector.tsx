'use client';

import { useState } from 'react';

interface PythonFileSelectorProps {
  pythonFiles: string[];
  selectedFile: string;
  onFileSelect: (file: string) => void;
  onAnalyze: () => void;
  isLoading?: boolean;
}

export function PythonFileSelector({ 
  pythonFiles, 
  selectedFile, 
  onFileSelect, 
  onAnalyze,
  isLoading = false 
}: PythonFileSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (pythonFiles.length <= 1) {
    return null; // Don't show selector if there's only one or no files
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300">
          Multiple Python Files Found
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
        >
          <svg
            className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      <p className="text-xs text-blue-700 dark:text-blue-400 mb-3">
        {pythonFiles.length} Python files detected. Currently analyzing: {selectedFile.split('/').pop()}
      </p>

      {isExpanded && (
        <div className="space-y-2">
          <div className="text-xs text-blue-600 dark:text-blue-400 mb-2">
            Select a different file to analyze:
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {pythonFiles.map((file, index) => (
              <label key={index} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="pythonFile"
                  value={file}
                  checked={file === selectedFile}
                  onChange={() => onFileSelect(file)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className={`text-xs font-mono ${
                  file === selectedFile 
                    ? 'text-blue-700 dark:text-blue-300 font-semibold' 
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {file}
                </span>
              </label>
            ))}
          </div>
          
          <button
            onClick={onAnalyze}
            disabled={isLoading}
            className="mt-3 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Selected File'}
          </button>
        </div>
      )}
    </div>
  );
}

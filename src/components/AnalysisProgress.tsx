'use client';

import { useState, useEffect } from 'react';

interface AnalysisProgressProps {
  currentStep: number;
  totalSteps: number;
  currentFile?: string;
  statusMessage?: string;
}

const steps = [
  { id: 1, name: 'Repository Clone', description: 'Cloning repository from Git' },
  { id: 2, name: 'File Discovery', description: 'Finding all code files' },
  { id: 3, name: 'Code Analysis', description: 'Analyzing code quality and complexity' },
  { id: 4, name: 'AI Insights', description: 'Generating AI-powered insights' },
  { id: 5, name: 'Report Generation', description: 'Preparing final results' }
];

export function AnalysisProgress({ currentStep, totalSteps, currentFile, statusMessage }: AnalysisProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const targetProgress = (currentStep / totalSteps) * 100;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= targetProgress) {
          clearInterval(interval);
          return targetProgress;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentStep, totalSteps]);

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
          <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Analyzing Repository
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {statusMessage || 'Please wait while we analyze your repository...'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Current File */}
      {currentFile && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm text-blue-800 dark:text-blue-300">
              Currently analyzing: <span className="font-mono font-medium">{currentFile}</span>
            </span>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isPending = currentStep < step.id;

          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isCurrent 
                    ? 'bg-indigo-500 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/30' 
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              
              <div className="ml-4 flex-1">
                <div className={`text-sm font-medium transition-all duration-300 ${
                  isCompleted 
                    ? 'text-green-700 dark:text-green-400' 
                    : isCurrent 
                      ? 'text-indigo-700 dark:text-indigo-400' 
                      : 'text-gray-500 dark:text-gray-500'
                }`}>
                  {step.name}
                  {isCurrent && (
                    <span className="ml-2 inline-flex items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                    </span>
                  )}
                </div>
                <div className={`text-xs transition-all duration-300 ${
                  isCompleted 
                    ? 'text-green-600 dark:text-green-500' 
                    : isCurrent 
                      ? 'text-indigo-600 dark:text-indigo-500' 
                      : 'text-gray-400 dark:text-gray-600'
                }`}>
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This may take a few minutes depending on the repository size
        </p>
      </div>
    </div>
  );
}

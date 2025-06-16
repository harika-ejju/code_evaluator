'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { FileAnalysisResult } from '../../components/CodeEvaluator';

function FileDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [fileDetails, setFileDetails] = useState<FileAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repoUrl = searchParams.get('repo');
  const branch = searchParams.get('branch') || '';
  const filePath = searchParams.get('file');

  useEffect(() => {
    if (!repoUrl || !filePath) {
      router.push('/');
      return;
    }

    // Try to get data from localStorage
    try {
      const storedData = localStorage.getItem('fileAnalysisData');
      if (storedData) {
        const { fileResult, repoUrl: storedRepoUrl, branch: storedBranch } = JSON.parse(storedData);
        
        // Verify this is the correct file
        if (storedRepoUrl === repoUrl && storedBranch === branch && 
            fileResult.file_info.relative_path === filePath) {
          setFileDetails(fileResult);
          setIsLoading(false);
          return;
        }
      }
      
      // If no stored data or mismatch, show error
      setError('File details not available. Please go back and select the file again.');
      setIsLoading(false);
      
    } catch (err) {
      setError('Error loading file details');
      setIsLoading(false);
    }
  }, [repoUrl, branch, filePath, router]);

  const handleBackToAnalysis = () => {
    const params = new URLSearchParams({ repo: repoUrl!, branch });
    router.push(`/analysis?${params.toString()}`);
  };

  if (!repoUrl || !filePath) {
    router.push('/');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Error Loading File Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <button
                onClick={handleBackToAnalysis}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Back to Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!fileDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                File Not Found
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The requested file could not be found.
              </p>
              <button
                onClick={handleBackToAnalysis}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Back to Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToAnalysis}
            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Analysis
          </button>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              File Analysis Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{repoUrl}</p>
            <p className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">{fileDetails.file_info.relative_path}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Info */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">File Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Filename:</span>
                    <p className="font-medium">{fileDetails.file_info.filename}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Language:</span>
                    <p className="font-medium">{fileDetails.file_info.language}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Size:</span>
                    <p className="font-medium">{fileDetails.file_info.size} chars</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Executable:</span>
                    <p className="font-medium">{fileDetails.file_info.is_executable ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
              
              {fileDetails.execution_result && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Execution Result
                  </h3>
                  <div className={`p-4 rounded-lg border ${
                    fileDetails.execution_result.success
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                      : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  }`}>
                    <div className="flex items-center mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        fileDetails.execution_result.success
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {fileDetails.execution_result.success ? '✅ Success' : '❌ Failed'}
                      </span>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        ({fileDetails.execution_result.execution_time?.toFixed(2) ?? '0.00'}s)
                      </span>
                    </div>
                    
                    {fileDetails.execution_result.output && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Output:</h4>
                        <pre className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 p-2 rounded overflow-x-auto">
                          {fileDetails.execution_result.output}
                        </pre>
                      </div>
                    )}
                    
                    {fileDetails.execution_result.error && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Error:</h4>
                        <pre className="text-sm text-red-600 dark:text-red-400 bg-white dark:bg-gray-700 p-2 rounded overflow-x-auto">
                          {fileDetails.execution_result.error}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Metrics */}
          <div className="space-y-6">
            {/* AI Score */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Quality Score</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                  {fileDetails.ai_score ? fileDetails.ai_score.toFixed(0) : 'N/A'}/100
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full" 
                    style={{ width: `${fileDetails.ai_score || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Complexity Analysis */}
            {fileDetails.complexity_analysis && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Complexity Analysis</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Time Complexity:</span>
                    <span className="font-medium font-mono">{fileDetails.complexity_analysis.time_complexity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Space Complexity:</span>
                    <span className="font-medium font-mono">{fileDetails.complexity_analysis.space_complexity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Complexity Score:</span>
                    <span className="font-medium">{fileDetails.complexity_analysis.complexity_score ?? 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quality Metrics */}
            {fileDetails.quality_metrics && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quality Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Maintainability:</span>
                    <span className="font-medium">{fileDetails.quality_metrics.maintainability_score?.toFixed(1) ?? 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duplicate Code Penalty:</span>
                    <span className="font-medium">{fileDetails.quality_metrics.duplicate_code_penalty?.toFixed(1) ?? 'N/A'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Best Practices:</span>
                    <span className="font-medium">{fileDetails.quality_metrics.best_practices_score?.toFixed(1) ?? 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Insights */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">AI Insights</h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {fileDetails.ai_insights}
              </p>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recommendations</h3>
              <p className="text-gray-700 dark:text-gray-300">
                {fileDetails.recommendations}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FileDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      <FileDetailsContent />
    </Suspense>
  );
}

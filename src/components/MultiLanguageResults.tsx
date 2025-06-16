'use client';

import { useState } from 'react';
import { AnalysisResponse, FileInfo } from '@/components/CodeEvaluator';

interface MultiLanguageResultsProps {
  results: AnalysisResponse;
  allFiles?: FileInfo[];
  onAnalyzeFile?: (filePath: string) => void;
  isAnalyzing?: boolean;
}

function ScoreCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStrokeColor = (score: number) => {
    if (score >= 80) return 'stroke-green-600';
    if (score >= 60) return 'stroke-yellow-600';
    return 'stroke-red-600';
  };

  return (
    <div className="relative w-32 h-32">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          strokeWidth="8"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${getStrokeColor(score)}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Score</div>
        </div>
      </div>
    </div>
  );
}

function FileExplorer({ files, analyzedFile, onAnalyzeFile, isAnalyzing }: {
  files: FileInfo[];
  analyzedFile: string;
  onAnalyzeFile?: (filePath: string) => void;
  isAnalyzing?: boolean;
}) {
  const [expandedLanguages, setExpandedLanguages] = useState<Set<string>>(new Set(['Python']));

  // Group files by language
  const filesByLanguage = files.reduce((acc, file) => {
    if (!acc[file.language]) {
      acc[file.language] = [];
    }
    acc[file.language].push(file);
    return acc;
  }, {} as Record<string, FileInfo[]>);

  const toggleLanguage = (language: string) => {
    const newExpanded = new Set(expandedLanguages);
    if (newExpanded.has(language)) {
      newExpanded.delete(language);
    } else {
      newExpanded.add(language);
    }
    setExpandedLanguages(newExpanded);
  };

  const getLanguageIcon = (language: string) => {
    const icons: Record<string, string> = {
      'Python': '🐍',
      'JavaScript': '📜',
      'TypeScript': '📘',
      'Java': '☕',
      'Go': '🔵',
      'Rust': '🦀',
      'C': '⚙️',
      'C++': '⚙️',
      'PHP': '🐘',
      'Ruby': '💎',
      'C#': '🔷',
      'Swift': '🍎',
      'Kotlin': '🎯',
    };
    return icons[language] || '📄';
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0" />
        </svg>
        Repository Files ({files.length} total)
      </h3>
      
      <div className="space-y-2">
        {Object.entries(filesByLanguage).map(([language, languageFiles]) => (
          <div key={language}>
            <button
              onClick={() => toggleLanguage(language)}
              className="flex items-center w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
            >
              <svg
                className={`w-4 h-4 mr-2 transform transition-transform ${
                  expandedLanguages.has(language) ? 'rotate-90' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="mr-2">{getLanguageIcon(language)}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {language} ({languageFiles.length})
              </span>
            </button>
            
            {expandedLanguages.has(language) && (
              <div className="ml-6 space-y-1">
                {languageFiles.map((file) => (
                  <div
                    key={file.path}
                    className={`flex items-center justify-between p-2 rounded text-sm ${
                      file.relative_path === analyzedFile
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-mono text-gray-700 dark:text-gray-300 truncate">
                        {file.relative_path}
                      </span>
                      {file.relative_path === analyzedFile && (
                        <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded flex-shrink-0">
                          Analyzed
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      {file.relative_path !== analyzedFile && onAnalyzeFile && (
                        <button
                          onClick={() => onAnalyzeFile(file.relative_path)}
                          disabled={isAnalyzing}
                          className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExecutionStatus({ execution }: { execution: any }) {
  return (
    <div className={`p-4 rounded-lg border ${
      execution.success 
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    }`}>
      <div className="flex items-center mb-2">
        <div className={`w-3 h-3 rounded-full mr-2 ${
          execution.success ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        <span className={`font-medium ${
          execution.success 
            ? 'text-green-800 dark:text-green-400' 
            : 'text-red-800 dark:text-red-400'
        }`}>
          {execution.success ? 'Execution Successful' : 'Execution Failed'}
        </span>
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          ({execution.execution_time.toFixed(2)}s)
        </span>
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
        Exit Code: {execution.exit_code}
      </div>
      
      {execution.output && (
        <div className="mt-3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Output:</div>
          <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto whitespace-pre-wrap">
            {execution.output}
          </pre>
        </div>
      )}
      
      {execution.error && (
        <div className="mt-3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Error:</div>
          <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto text-red-600 dark:text-red-400 whitespace-pre-wrap">
            {execution.error}
          </pre>
        </div>
      )}
    </div>
  );
}

export function MultiLanguageResults({ results, allFiles, onAnalyzeFile, isAnalyzing }: MultiLanguageResultsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'code' | 'execution' | 'insights'>('overview');

  const displayFiles = allFiles || results.all_files || [];

  if (!results.analyzed_file_found) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No Code Files Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No supported code files were found in the repository:
          </p>
          <p className="text-sm font-mono text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded mb-4">
            {results.repository_url}
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                  Recommendations:
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {results.recommendations}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Code Analysis Results
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {results.repository_url}
          </p>
          
          {/* Analyzed file info */}
          <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                Analyzed File ({results.analyzed_file_language}):
              </span>
            </div>
            <p className="text-indigo-700 dark:text-indigo-400 font-mono text-sm mt-1">
              {results.analyzed_file_path}
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <ScoreCircle score={results.ai_score} />
        </div>
      </div>

      {/* Quick Summary Section */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${results.execution_result.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              {results.execution_result.success ? 'Executed Successfully' : 'Execution Failed'}
            </span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0" />
            </svg>
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {displayFiles.length} Code Files
            </span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
              {results.execution_result.execution_time.toFixed(2)}s Runtime
            </span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
              Quality Score: {results.ai_score.toFixed(0)}/100
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'files', label: 'All Files' },
              { id: 'execution', label: 'Execution' },
              { id: 'code', label: 'Code' },
              { id: 'insights', label: 'AI Insights' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {results.execution_result.success ? '✅' : '❌'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Execution Status</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {results.execution_result.success ? 'Success' : 'Failed'}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {results.execution_result.execution_time.toFixed(2)}s
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Execution Time</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Runtime duration
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {results.analyzed_file_content.split('\n').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Lines of Code</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Total lines in {results.analyzed_file_path.split('/').pop()}
              </div>
            </div>
          </div>
          
          <ExecutionStatus execution={results.execution_result} />
        </div>
      )}

      {activeTab === 'files' && (
        <FileExplorer
          files={displayFiles}
          analyzedFile={results.analyzed_file_path}
          onAnalyzeFile={onAnalyzeFile}
          isAnalyzing={isAnalyzing}
        />
      )}

      {activeTab === 'execution' && (
        <div className="space-y-4">
          <ExecutionStatus execution={results.execution_result} />
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Execution Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`ml-2 font-medium ${
                  results.execution_result.success 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {results.execution_result.success ? 'Success' : 'Failed'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Exit Code:</span>
                <span className="ml-2 font-mono">{results.execution_result.exit_code}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Execution Time:</span>
                <span className="ml-2 font-mono">{results.execution_result.execution_time.toFixed(3)}s</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Output Length:</span>
                <span className="ml-2">{results.execution_result.output.length} characters</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'code' && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {results.analyzed_file_path.split('/').pop() || 'Code File'} Content
              </h3>
              <div className="text-right">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono block">
                  {results.analyzed_file_path}
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {results.analyzed_file_language}
                </span>
              </div>
            </div>
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <code>{results.analyzed_file_content}</code>
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-400 mb-3">
              🤖 AI Code Analysis
            </h3>
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {results.ai_insights}
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-green-900 dark:text-green-400 mb-3">
              💡 Recommendations
            </h3>
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {results.recommendations}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

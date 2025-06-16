'use client';

import { useState } from 'react';
import { BulkAnalysisResponse, FileAnalysisResult } from '@/components/CodeEvaluator';

interface BulkAnalysisResultsProps {
  results: BulkAnalysisResponse;
  onNavigateToFile?: (fileResult: FileAnalysisResult) => void;
}

function ScoreCircle({ score, size = 'large' }: { score: number; size?: 'small' | 'medium' | 'large' }) {
  const dimensions = {
    small: { w: 16, h: 16, r: 6, sw: 2, text: 'text-xs' },
    medium: { w: 24, h: 24, r: 10, sw: 3, text: 'text-sm' },
    large: { w: 32, h: 32, r: 14, sw: 4, text: 'text-lg' }
  };
  
  const { w, h, r, sw, text } = dimensions[size];
  const circumference = 2 * Math.PI * r;
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
    <div className={`relative w-${w} h-${h}`}>
      <svg className={`w-${w} h-${h} transform -rotate-90`} viewBox="0 0 32 32">
        <circle
          cx="16"
          cy="16"
          r={r}
          stroke="currentColor"
          strokeWidth={sw}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="16"
          cy="16"
          r={r}
          strokeWidth={sw}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${getStrokeColor(score)}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${text} font-bold ${getScoreColor(score)}`}>
          {score.toFixed(0)}
        </div>
      </div>
    </div>
  );
}

function LanguageDistributionChart({ distribution }: { distribution: { [key: string]: number } }) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const sortedLanguages = Object.entries(distribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6); // Show top 6 languages

  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
    'bg-yellow-500', 'bg-red-500', 'bg-indigo-500'
  ];

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900 dark:text-white">Language Distribution</h4>
      <div className="space-y-2">
        {sortedLanguages.map(([language, count], index) => {
          const percentage = (count / total) * 100;
          return (
            <div key={language} className="flex items-center">
              <div className={`w-3 h-3 rounded ${colors[index % colors.length]} mr-2`}></div>
              <div className="flex-1 flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">{language}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {count} ({percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FileCard({ fileResult, onNavigate }: { fileResult: FileAnalysisResult; onNavigate?: (file: FileAnalysisResult) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <ScoreCircle score={fileResult.ai_score} size="medium" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {fileResult.file_info.filename}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {fileResult.file_info.relative_path}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              fileResult.file_info.language === 'Python' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
              fileResult.file_info.language === 'JavaScript' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
              fileResult.file_info.language === 'Java' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
            }`}>
              {fileResult.file_info.language}
            </span>
            
            {fileResult.file_info.is_executable && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Executable
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {fileResult.complexity_analysis && (
            <>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-xs text-gray-500 dark:text-gray-400">Time</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {fileResult.complexity_analysis.time_complexity}
                </div>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-xs text-gray-500 dark:text-gray-400">Space</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {fileResult.complexity_analysis.space_complexity}
                </div>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-xs text-gray-500 dark:text-gray-400">Optimization</div>
                <div className={`text-sm font-medium ${
                  fileResult.complexity_analysis.optimization_level === 'Optimal' ? 'text-green-600 dark:text-green-400' :
                  fileResult.complexity_analysis.optimization_level === 'Good' ? 'text-blue-600 dark:text-blue-400' :
                  fileResult.complexity_analysis.optimization_level === 'Average' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {fileResult.complexity_analysis.optimization_level}
                </div>
              </div>
            </>
          )}
          
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="text-xs text-gray-500 dark:text-gray-400">Quality</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {fileResult.quality_metrics.overall_quality_score}/100
            </div>
          </div>
        </div>

        {fileResult.execution_result && (
          <div className={`p-2 rounded text-xs mb-3 ${
            fileResult.execution_result.success 
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {fileResult.execution_result.success ? '✅ Executed Successfully' : '❌ Execution Failed'}
            {fileResult.execution_result.success && (
              <span className="ml-2">({fileResult.execution_result.execution_time.toFixed(2)}s)</span>
            )}
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
          
          {onNavigate && (
            <button
              onClick={() => onNavigate(fileResult)}
              className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
            >
              View Details
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">AI Insights</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">{fileResult.ai_insights}</p>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Recommendations</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">{fileResult.recommendations}</p>
            </div>

            {fileResult.complexity_analysis && (
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Complexity Analysis</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">{fileResult.complexity_analysis.explanation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function BulkAnalysisResults({ results, onNavigateToFile }: BulkAnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'insights'>('overview');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'language'>('score');
  
  const sortedFiles = [...results.analyzed_files].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.ai_score - a.ai_score;
      case 'name':
        return a.file_info.filename.localeCompare(b.file_info.filename);
      case 'language':
        return a.file_info.language.localeCompare(b.file_info.language);
      default:
        return 0;
    }
  });

  const getComplexityBadge = (result: FileAnalysisResult) => {
    if (!result.complexity_analysis) return null;
    
    const level = result.complexity_analysis.optimization_level.toLowerCase();
    const colorClass = {
      'optimal': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
      'good': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
      'average': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
      'poor': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
      'brute force': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400'
    }[level] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
        {result.complexity_analysis.optimization_level}
      </span>
    );
  };

  const averageComplexityScore = results.analyzed_files
    .filter(f => f.complexity_analysis)
    .reduce((sum, f) => sum + (f.complexity_analysis?.complexity_score || 0), 0) / 
    results.analyzed_files.filter(f => f.complexity_analysis).length || 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Repository Analysis Complete
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              {results.repository_url}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              {results.repository_overview}
            </p>
          </div>
          
          <div className="mt-4 lg:mt-0 lg:ml-6 flex items-center">
            <ScoreCircle score={results.overall_repository_score} size="large" />
            <div className="ml-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Overall Score</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {results.overall_repository_score.toFixed(1)}/100
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{results.total_files}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Files</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{results.analyzed_files.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Analyzed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {Object.keys(results.language_distribution).length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Languages</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {averageComplexityScore.toFixed(0)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Avg Complexity</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6">
        <nav className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'files', label: `Files (${results.analyzed_files.length})` },
            { id: 'insights', label: 'Insights & Recommendations' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
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

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <LanguageDistributionChart distribution={results.language_distribution} />
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Analysis Summary</h4>
                <p className="text-gray-600 dark:text-gray-400">{results.analysis_summary}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Top Issues</h4>
                <ul className="space-y-2">
                  {results.top_issues.map((issue, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Quick Recommendations</h4>
                <ul className="space-y-2">
                  {results.recommendations.slice(0, 3).map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Analyzed Files ({results.analyzed_files.length})
              </h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="score">Sort by Score</option>
                <option value="name">Sort by Name</option>
                <option value="language">Sort by Language</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedFiles.map((fileResult, index) => (
                <FileCard
                  key={index}
                  fileResult={fileResult}
                  onNavigate={onNavigateToFile}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Detailed Issues & Recommendations
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-red-900 dark:text-red-400 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Issues Found
                  </h4>
                  <ul className="space-y-2">
                    {results.top_issues.map((issue, index) => (
                      <li key={index} className="text-sm text-red-800 dark:text-red-300 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {results.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-blue-800 dark:text-blue-300 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Performance Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.analyzed_files
                  .filter(f => f.complexity_analysis)
                  .slice(0, 6)
                  .map((file, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {file.file_info.filename}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div>Time: {file.complexity_analysis?.time_complexity}</div>
                      <div>Space: {file.complexity_analysis?.space_complexity}</div>
                      <div>Level: {file.complexity_analysis?.optimization_level}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

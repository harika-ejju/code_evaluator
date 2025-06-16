'use client';

import { useState } from 'react';
import { RepositoryForm } from '@/components/RepositoryForm';
import { MultiLanguageResults } from '@/components/MultiLanguageResults';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  execution_time: number;
  exit_code: number;
}

export interface FileInfo {
  path: string;
  relative_path: string;
  filename: string;
  language: string;
  size: number;
  is_executable: boolean;
  priority: number;
}

export interface ComplexityAnalysis {
  time_complexity: string;
  space_complexity: string;
  optimization_level: string;
  complexity_score: number;
  explanation: string;
}

export interface CodeQualityMetrics {
  syntax_score: number;
  readability_score: number;
  maintainability_score: number;
  duplicate_code_penalty: number;
  best_practices_score: number;
  overall_quality_score: number;
}

export interface FileAnalysisResult {
  file_info: FileInfo;
  content: string;
  execution_result?: ExecutionResult;
  ai_score: number;
  complexity_analysis?: ComplexityAnalysis;
  quality_metrics: CodeQualityMetrics;
  ai_insights: string;
  recommendations: string;
  analysis_timestamp: string;
}

export interface BulkAnalysisResponse {
  repository_url: string;
  branch: string;
  total_files: number;
  analyzed_files: FileAnalysisResult[];
  repository_overview: string;
  overall_repository_score: number;
  language_distribution: { [key: string]: number };
  analysis_summary: string;
  top_issues: string[];
  recommendations: string[];
}

export interface AnalysisResponse {
  repository_url: string;
  analyzed_file_found: boolean;
  analyzed_file_path: string;
  analyzed_file_content: string;
  analyzed_file_language: string;
  all_files: FileInfo[];
  execution_result: ExecutionResult;
  ai_score: number;
  ai_insights: string;
  recommendations: string;
}

export interface FilesResponse {
  repository_url: string;
  files: FileInfo[];
}

export interface FilesResponse {
  files: FileInfo[];
}

export function CodeEvaluator() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (repoUrl: string, branch: string = '') => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          branch: branch,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze repository');
      }

      const data: AnalysisResponse = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
        <RepositoryForm onAnalyze={handleAnalyze} isLoading={isLoading} />
        
        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">
                  Analysis Error
                </h3>
                <div className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
                <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                  Please check that the repository URL is valid and contains Python files.
                </div>
              </div>
            </div>
          </div>
        )}
        
        {isLoading && <LoadingSpinner />}
      </div>
      
      {results && <MultiLanguageResults results={results} />}
    </div>
  );
}

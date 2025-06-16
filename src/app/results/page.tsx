'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { MultiLanguageResults } from '@/components/MultiLanguageResults';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AnalysisResponse, FileInfo, FilesResponse } from '@/components/CodeEvaluator';

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  const [allFiles, setAllFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repoUrl = searchParams.get('repo');
  const branch = searchParams.get('branch') || '';

  // Load all files first, then do the initial analysis
  useEffect(() => {
    if (!repoUrl) {
      router.push('/');
      return;
    }

    const loadRepositoryData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // First, get all files in the repository
        const branchParam = branch ? `&branch=${encodeURIComponent(branch)}` : '';
        const filesResponse = await fetch(`http://localhost:8000/files?repo_url=${encodeURIComponent(repoUrl)}${branchParam}`);
        
        if (filesResponse.ok) {
          const filesData: FilesResponse = await filesResponse.json();
          setAllFiles(filesData.files);
        }

        // Then analyze the repository (this will pick the most likely main file)
        const analysisResponse = await fetch('http://localhost:8000/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repo_url: repoUrl,
            branch: branch,
          }),
        });

        if (!analysisResponse.ok) {
          const errorData = await analysisResponse.json();
          throw new Error(errorData.detail || 'Failed to analyze repository');
        }

        const analysisData: AnalysisResponse = await analysisResponse.json();
        setResults(analysisData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      } finally {
        setIsLoading(false);
      }
    };

    loadRepositoryData();
  }, [repoUrl, branch, router]);

  const handleAnalyzeFile = async (filePath: string) => {
    if (!repoUrl) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          branch: branch,
          specific_file: filePath,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze file');
      }

      const data: AnalysisResponse = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during file analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!repoUrl) {
    router.push('/');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Code Evaluator
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Loading repository and analyzing code...
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Repository: {repoUrl}
              </div>
              <LoadingSpinner />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Analysis Error
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error}
              </p>
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Try Another Repository
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No Results
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Unable to analyze the repository. Please try again.
              </p>
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Try Another Repository
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-6">
      <div className="max-w-6xl mx-auto">
        <MultiLanguageResults
          results={results}
          allFiles={allFiles}
          onAnalyzeFile={handleAnalyzeFile}
          isAnalyzing={isAnalyzing}
        />
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}

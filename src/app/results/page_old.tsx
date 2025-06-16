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
  const branch = searchParams.get('branch') || 'main';

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
        const filesResponse = await fetch(`http://localhost:8000/files?repo_url=${encodeURIComponent(repoUrl)}&branch=${encodeURIComponent(branch)}`);
        
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

  const handleNewAnalysis = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Analyzing Repository
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Processing: <span className="font-mono text-sm">{repoUrl}</span>
            </p>
          </div>
          <LoadingSpinner />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Analysis Failed
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {error}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleNewAnalysis}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Try Another Repository
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Retry Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!results) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Analysis Complete
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Results for your Python code analysis
            </p>
          </div>
          <button
            onClick={handleNewAnalysis}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Analyze New Repository
          </button>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <MultiLanguageResults 
            results={results} 
            allFiles={allFiles}
            onAnalyzeFile={handleAnalyzeFile}
            isAnalyzing={isAnalyzing}
          />
        </div>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Loading...</h1>
          </div>
        </div>
      </main>
    }>
      <ResultsContent />
    </Suspense>
  );
}

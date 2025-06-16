'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { BulkAnalysisResults } from '@/components/BulkAnalysisResults';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { ResultsNavigation } from '@/components/ResultsNavigation';
import { BulkAnalysisResponse, FileAnalysisResult } from '@/components/CodeEvaluator';

function AnalysisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<BulkAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('Initializing analysis...');
  const [currentStep, setCurrentStep] = useState(1);
  const [currentFile, setCurrentFile] = useState<string>('');

  const repoUrl = searchParams.get('repo');
  const branch = searchParams.get('branch') || '';

  useEffect(() => {
    if (!repoUrl) {
      router.push('/');
      return;
    }

    const performBulkAnalysis = async () => {
      setIsLoading(true);
      setError(null);

      try {
        setProgress('Cloning repository...');
        setCurrentStep(1);
        
        // Simulate progress updates
        const progressUpdates = [
          { step: 1, message: 'Cloning repository...', delay: 500 },
          { step: 2, message: 'Discovering code files...', delay: 1000 },
          { step: 3, message: 'Analyzing code complexity...', delay: 1500 },
          { step: 4, message: 'Generating AI insights...', delay: 2000 },
          { step: 5, message: 'Preparing results...', delay: 2500 }
        ];

        progressUpdates.forEach(({ step, message, delay }) => {
          setTimeout(() => {
            setCurrentStep(step);
            setProgress(message);
          }, delay);
        });
        
        // Call the bulk analysis endpoint
        const response = await fetch('http://localhost:8000/analyze-bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repo_url: repoUrl,
            branch: branch,
            bulk_analyze: true,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to perform bulk analysis');
        }

        setProgress('Analysis complete!');
        setCurrentStep(5);
        const data: BulkAnalysisResponse = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred during bulk analysis');
      } finally {
        setIsLoading(false);
      }
    };

    performBulkAnalysis();
  }, [repoUrl, branch, router]);

  const handleNavigateToFile = (fileResult: FileAnalysisResult) => {
    // Store the file data in localStorage and navigate
    localStorage.setItem('fileAnalysisData', JSON.stringify({
      fileResult,
      repoUrl,
      branch
    }));
    
    const params = new URLSearchParams({
      repo: repoUrl!,
      branch: branch,
      file: fileResult.file_info.relative_path,
    });
    router.push(`/file-details?${params.toString()}`);
  };

  const handleBackToInput = () => {
    router.push('/');
  };

  const handleAnalyzeAnother = () => {
    router.push('/');
  };

  if (!repoUrl) {
    router.push('/');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900" style={{
        background: `linear-gradient(135deg, #0a0e27 0%, #1a1b3a 50%, #0f0f23 100%)`,
        backgroundAttachment: 'fixed'
      }}>
        <div className="relative max-w-6xl mx-auto py-12 px-6">
          <AnalysisProgress 
            currentStep={currentStep}
            totalSteps={5}
            currentFile={currentFile}
            statusMessage={progress}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900" style={{
        background: `linear-gradient(135deg, #0a0e27 0%, #1a1b3a 50%, #0f0f23 100%)`,
        backgroundAttachment: 'fixed'
      }}>
        <div className="max-w-6xl mx-auto p-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-red-400/30 p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Analysis Failed
                </h2>
                <p className="text-slate-300 mb-4">
                  {error}
                </p>
                <div className="space-x-4">
                  <button
                    onClick={handleBackToInput}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg blur opacity-75"></div>
                    <div className="relative bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 px-6 py-2 rounded-lg text-white font-medium">
                      Try Another Repository
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900" style={{
      background: `linear-gradient(135deg, #0a0e27 0%, #1a1b3a 50%, #0f0f23 100%)`,
      backgroundAttachment: 'fixed'
    }}>
      <ResultsNavigation 
        repositoryUrl={results.repository_url}
        totalFiles={results.total_files}
        overallScore={results.overall_repository_score}
      />
      
      <div className="relative max-w-6xl mx-auto px-6 pb-12">
        <BulkAnalysisResults 
          results={results} 
          onNavigateToFile={handleNavigateToFile}
        />
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="text-center">
              <LoadingSpinner />
            </div>
          </div>
        </div>
      </div>
    }>
      <AnalysisContent />
    </Suspense>
  );
}

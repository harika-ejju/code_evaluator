'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ResultsNavigationProps {
  repositoryUrl: string;
  totalFiles: number;
  overallScore: number;
}

export function ResultsNavigation({ repositoryUrl, totalFiles, overallScore }: ResultsNavigationProps) {
  const router = useRouter();

  const handleAnalyzeAnother = () => {
    router.push('/');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  return (
    <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 mb-8">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          {/* Repository Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V9a2 2 0 00-2-2H7a2 2 0 00-2 2v2a2 2 0 002 2h6a2 2 0 002-2V9z" />
              </svg>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {repositoryUrl.split('/').slice(-2).join('/')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {totalFiles} files analyzed
                </div>
              </div>
            </div>
            
            {/* Overall Score Badge */}
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(overallScore)}`}>
              <span className="flex items-center space-x-1">
                <span>Overall Score:</span>
                <span className="font-bold">{overallScore.toFixed(1)}/100</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleAnalyzeAnother}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Analyze Another
            </button>
            
            <Link
              href="/"
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

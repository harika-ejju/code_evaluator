'use client';

import { useState } from 'react';
import { SampleRepositories } from '@/components/SampleRepositories';

interface RepositoryFormProps {
  onAnalyze: (repoUrl: string, branch: string) => void;
  isLoading: boolean;
}

export function RepositoryForm({ onAnalyze, isLoading }: RepositoryFormProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl.trim()) {
      // If no branch is specified, let the backend determine the default branch
      onAnalyze(repoUrl.trim(), branch.trim() || '');
    }
  };

  const handleSampleSelect = (url: string) => {
    setRepoUrl(url);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="repo-url" className="block text-sm font-medium text-cyan-300 mb-2">
            Git Repository URL
          </label>
          <input
            type="url"
            id="repo-url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repository.git"
            className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-400/30 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-slate-400 backdrop-blur-sm hover:border-cyan-400/50"
            required
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="branch" className="block text-sm font-medium text-cyan-300 mb-2">
            Branch (optional)
          </label>
          <input
            type="text"
            id="branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="Leave empty to use repository's default branch"
            className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-400/30 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-slate-400 backdrop-blur-sm hover:border-cyan-400/50"
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !repoUrl.trim()}
          className="w-full relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg blur opacity-75"></div>
          <div className="relative bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-700 px-4 py-3 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? '🔄 Analyzing All Files...' : '🚀 Start Comprehensive Analysis'}
          </div>
        </button>
        
        <div className="mt-6 p-4 bg-slate-800/30 backdrop-blur-sm rounded-lg border border-cyan-400/20">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-cyan-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-cyan-100">
              <div className="font-medium mb-1 text-cyan-300">What This Analysis Includes:</div>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                <li>Automatic detection and analysis of ALL code files</li>
                <li>Time & space complexity analysis for Python/Java</li>
                <li>Code quality metrics and syntax validation</li>
                <li>AI-powered insights and optimization recommendations</li>
                <li>Multi-language support (Python, JavaScript, Java, etc.)</li>
                <li>Repository overview with scoring and issue detection</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
      
      {!isLoading && <SampleRepositories onSelectRepository={handleSampleSelect} />}
    </div>
  );
}

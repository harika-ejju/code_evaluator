'use client';

import { useRouter } from 'next/navigation';
import { RepositoryForm } from '@/components/RepositoryForm';

export default function Home() {
  const router = useRouter();

  const handleAnalyze = async (repoUrl: string, branch: string = '') => {
    // Navigate to bulk analysis page with parameters
    const searchParams = new URLSearchParams({
      repo: repoUrl,
    });
    
    // Only add branch parameter if it's not empty
    if (branch.trim()) {
      searchParams.set('branch', branch);
    }
    
    router.push(`/analysis?${searchParams.toString()}`);
  };

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Analysis',
      description: 'Advanced AI evaluates code quality, complexity, and provides optimization suggestions'
    },
    {
      icon: '⚡',
      title: 'Multi-Language Support',
      description: 'Supports Python, JavaScript, Java, TypeScript, Go, Rust, and many more languages'
    },
    {
      icon: '📊',
      title: 'Complexity Scoring',
      description: 'Detailed time/space complexity analysis with scoring based on algorithmic efficiency'
    },
    {
      icon: '🔍',
      title: 'Code Quality Metrics',
      description: 'Comprehensive quality assessment including readability, maintainability, and best practices'
    },
    {
      icon: '📈',
      title: 'Repository Overview',
      description: 'Get a complete summary of your entire repository with actionable insights'
    },
    {
      icon: '🚀',
      title: 'Instant Results',
      description: 'Fast analysis with beautiful, interactive reports and detailed breakdowns'
    }
  ];

  return (
    <main className="min-h-screen bg-slate-900" style={{
      background: `linear-gradient(135deg, #0a0e27 0%, #1a1b3a 50%, #0f0f23 100%)`,
      backgroundAttachment: 'fixed'
    }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full blur opacity-75"></div>
              <div className="relative bg-gradient-to-r from-cyan-400 to-purple-500 w-full h-full rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Code Evaluator
              <span className="gradient-text bg-gradient-to-r from-cyan-400 via-purple-500 to-green-400 bg-clip-text text-transparent"> AI</span>
            </h1>
            <p className="text-xl md:text-2xl text-cyan-100 mb-4 max-w-3xl mx-auto">
              Revolutionary Multi-Language Code Analysis Platform
            </p>
            <p className="text-lg text-slate-300 max-w-4xl mx-auto mb-8">
              Automatically analyze ALL files in any Git repository with AI-powered insights, 
              complexity scoring, quality assessment, and optimization recommendations. 
              Get instant, comprehensive reports for Python, JavaScript, Java, and 15+ other languages.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
              <div className="flex items-center text-green-400">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">No Authentication Required</span>
              </div>
              <div className="flex items-center text-cyan-400">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium">Instant Analysis</span>
              </div>
              <div className="flex items-center text-purple-400">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                <span className="font-medium">15+ Languages</span>
              </div>
            </div>
          </div>
          
          {/* Analysis Form */}
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-500/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-cyan-400/30 p-8 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 to-purple-500/5 rounded-2xl"></div>
                <div className="relative">
                  <RepositoryForm onAnalyze={handleAnalyze} isLoading={false} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need for comprehensive code analysis and optimization
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-500/20 rounded-xl blur opacity-50"></div>
                <div className="relative bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-cyan-400/20 hover:border-cyan-400/40">
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-3 hover:text-cyan-400">
                    {feature.title}
                  </h3>
                  <p className="text-slate-300 hover:text-slate-200">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Analyze Your Code?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who trust Code Evaluator AI for comprehensive code analysis
          </p>
          <a 
            href="#top" 
            className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg"
          >
            Get Started Now
            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </main>
  );
}

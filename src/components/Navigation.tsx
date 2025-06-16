'use client';

import { useRouter, usePathname } from 'next/navigation';

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div 
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Code Evaluator AI
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {(pathname === '/results' || pathname === '/analysis' || pathname === '/file-details') && (
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                Analyze New Repository
              </button>
            )}
            
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <div className={`w-2 h-2 rounded-full ${pathname === '/' ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
              <span className={pathname === '/' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}>
                Input
              </span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <div className={`w-2 h-2 rounded-full ${pathname === '/analysis' || pathname === '/results' ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
              <span className={pathname === '/analysis' || pathname === '/results' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}>
                Analysis
              </span>
              {pathname === '/file-details' && (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    File Details
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700"></div>
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
      </div>
      <p className="mt-6 text-lg font-medium text-gray-700 dark:text-gray-300">
        Analyzing Repository
      </p>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        This may take 30-60 seconds depending on repository size
      </p>
      
      <div className="mt-6 max-w-lg w-full">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">
            🔍 Analysis Process
          </h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Cloning Git repository</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Scanning for Python files</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3 animate-pulse"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Executing Python code</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-3 animate-pulse"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Generating code insights and analysis</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-indigo-500 rounded-full mr-3 animate-pulse"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Calculating quality score</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

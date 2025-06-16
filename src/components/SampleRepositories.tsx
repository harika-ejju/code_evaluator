'use client';

interface SampleRepository {
  name: string;
  url: string;
  description: string;
  complexity: 'Simple' | 'Medium' | 'Complex';
  files: number;
}

const sampleRepositories: SampleRepository[] = [
  {
    name: "Python CPython Tools",
    url: "https://github.com/python/cpython.git",
    description: "Python interpreter source code with various Python utilities",
    complexity: "Complex",
    files: 50
  },
  {
    name: "Simple Python Scripts", 
    url: "https://github.com/geekcomputers/Python.git",
    description: "Collection of Python utilities and automation scripts",
    complexity: "Simple",
    files: 10
  },
  {
    name: "Python Algorithms",
    url: "https://github.com/TheAlgorithms/Python.git",
    description: "Comprehensive collection of Python algorithms and data structures",
    complexity: "Medium",
    files: 25
  }
];

interface SampleRepositoriesProps {
  onSelectRepository: (url: string) => void;
}

export function SampleRepositories({ onSelectRepository }: SampleRepositoriesProps) {
  return (
    <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        📚 Try Sample Repositories
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Test the code evaluator with these popular Python repositories:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sampleRepositories.map((repo, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">{repo.name}</h4>
              <span className={`px-2 py-1 rounded-full text-xs ${
                repo.complexity === 'Simple' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : repo.complexity === 'Medium'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {repo.complexity}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {repo.description}
            </p>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-500">
                ~{repo.files} Python files
              </span>
              <button
                onClick={() => onSelectRepository(repo.url)}
                className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
              >
                Analyze
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        💡 <strong>Tip:</strong> Our analyzer automatically finds and executes the best Python file in any repository.
        It prioritizes main.py, app.py, run.py, and other common entry points, but can analyze any Python file.
        The tool will show you all Python files found and indicate which one was selected for analysis.
      </div>
    </div>
  );
}

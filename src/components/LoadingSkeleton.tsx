/**
 * Loading Skeleton Components for better UX
 */

export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {[1, 2, 3, 4].map((i) => (
                <th
                  key={i}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                {[1, 2, 3, 4].map((j) => (
                  <td key={j} className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-400 dark:bg-gray-500 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-400 dark:bg-gray-500 rounded w-32"></div>
          </div>
          <div className="w-12 h-12 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4"
        >
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      ))}
      <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
    </div>
  );
}


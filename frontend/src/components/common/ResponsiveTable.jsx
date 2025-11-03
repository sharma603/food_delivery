import React from 'react';
import { Eye, Edit, Trash2, MoreVertical } from 'lucide-react';

/**
 * Fully Responsive Table Component using Tailwind CSS
 * - Desktop: Shows as standard table
 * - Mobile/Tablet: Converts to card layout
 * - Uses Tailwind breakpoints: sm, md, lg, xl
 */
const ResponsiveTable = ({ 
  columns, 
  data, 
  onRowClick, 
  loading = false, 
  emptyMessage = 'No data available',
  actions = []
}) => {
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500 text-lg">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop Table View - Hidden on mobile, visible from md+ */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr
                key={row._id || row.id || index}
                onClick={() => onRowClick && onRowClick(row)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(row);
                          }}
                          className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            action.variant === 'danger'
                              ? 'text-red-700 bg-red-50 hover:bg-red-100'
                              : action.variant === 'primary'
                              ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                              : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          {action.icon && <action.icon className="w-4 h-4 mr-1.5" />}
                          <span className="hidden sm:inline">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Visible on mobile, hidden from md+ */}
      <div className="md:hidden space-y-4">
        {data.map((row, index) => (
          <div
            key={row._id || row.id || index}
            onClick={() => onRowClick && onRowClick(row)}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="space-y-3">
              {columns.map((col) => (
                <div key={col.key} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {col.label}
                  </span>
                  <span className="text-sm text-gray-900 font-medium">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </span>
                </div>
              ))}
              
              {actions.length > 0 && (
                <div className="pt-3 border-t border-gray-200 flex gap-2 flex-wrap">
                  {actions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(row);
                      }}
                      className={`flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        action.variant === 'danger'
                          ? 'text-red-700 bg-red-50 hover:bg-red-100'
                          : action.variant === 'primary'
                          ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                          : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveTable;


import React from 'react';
import './Table.css';

const Table = ({ 
  columns, 
  data, 
  onRowClick, 
  loading = false, 
  emptyMessage = 'No data available',
  onSelectAll,
  allSelected = false
}) => {
  if (loading) {
    return (
      <div className="table-container">
        <div className="table-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-container">
        <div className="table-empty">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="table-header">
                {col.key === 'checkbox' && onSelectAll ? (
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                  />
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row._id || row.id || index}
              className="table-row"
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="table-cell">
                  {col.render ? col.render(row) : (
                    Array.isArray(row[col.key]) ? row[col.key].join(', ') : row[col.key]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;

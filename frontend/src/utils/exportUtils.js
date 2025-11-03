// Export Utilities
// This file structure created as per requested organization

export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
};

export const exportToJSON = (data, filename = 'export.json') => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
};

export const exportToTXT = (data, filename = 'export.txt') => {
  let content = '';
  
  if (Array.isArray(data)) {
    content = data.map(item => 
      typeof item === 'object' 
        ? JSON.stringify(item, null, 2)
        : String(item)
    ).join('\n\n');
  } else {
    content = typeof data === 'object' 
      ? JSON.stringify(data, null, 2)
      : String(data);
  }

  downloadFile(content, filename, 'text/plain');
};

export const exportTableToCSV = (tableId, filename = 'table-export.csv') => {
  const table = document.getElementById(tableId);
  if (!table) return;

  const rows = Array.from(table.querySelectorAll('tr'));
  const csvContent = rows.map(row =>
    Array.from(row.querySelectorAll('td, th'))
      .map(cell => {
        const text = cell.textContent.trim();
        return text.includes(',') ? `"${text}"` : text;
      })
      .join(',')
  ).join('\n');

  downloadFile(csvContent, filename, 'text/csv');
};

export const exportChartData = (chartData, chartType, filename) => {
  const exportData = {
    type: chartType,
    data: chartData,
    exportedAt: new Date().toISOString(),
  };

  exportToJSON(exportData, filename || `chart-${chartType}-export.json`);
};

export const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(url);
};

export const printElement = (elementId) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Print</title>
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          @media print { 
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};

export const generateReportData = (data, reportType, dateRange) => {
  return {
    reportType,
    dateRange,
    generatedAt: new Date().toISOString(),
    totalRecords: data.length,
    data,
    summary: generateSummary(data, reportType),
  };
};

const generateSummary = (data, reportType) => {
  switch (reportType) {
    case 'orders':
      return {
        totalOrders: data.length,
        totalRevenue: data.reduce((sum, order) => sum + (order.amount || 0), 0),
        averageOrderValue: data.length > 0 
          ? data.reduce((sum, order) => sum + (order.amount || 0), 0) / data.length 
          : 0,
      };
    
    case 'restaurants':
      return {
        totalRestaurants: data.length,
        activeRestaurants: data.filter(r => r.status === 'active').length,
        verifiedRestaurants: data.filter(r => r.verified).length,
      };
    
    case 'users':
      return {
        totalUsers: data.length,
        activeUsers: data.filter(u => u.status === 'active').length,
        newUsers: data.filter(u => 
          new Date(u.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length,
      };
    
    default:
      return { totalRecords: data.length };
  }
};

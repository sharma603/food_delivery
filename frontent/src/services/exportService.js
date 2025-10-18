// Export Service
// This file structure created as per requested organization

class ExportService {
  static downloadCSV(data, filename = 'export.csv') {
    const csvContent = this.convertToCSV(data);
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  static downloadJSON(data, filename = 'export.json') {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, filename, 'application/json');
  }

  static downloadExcel(data, filename = 'export.xlsx') {
    // This would require a library like xlsx
    console.log('Excel export would be implemented with xlsx library');
  }

  static convertToCSV(data) {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  static downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export default ExportService;

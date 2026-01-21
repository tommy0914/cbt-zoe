import api from '../services/api';

export default function ExportResults({ testId, classId, type = 'test' }) {
  const handleExport = async () => {
    try {
      let endpoint = '';

      if (type === 'test') {
        endpoint = `/quickwins/export/test-results/${testId}`;
      } else if (type === 'leaderboard') {
        endpoint = `/quickwins/export/leaderboard/${classId}`;
      } else if (type === 'class-report') {
        endpoint = `/quickwins/export/class-report/${classId}`;
      }

      // Make the request and get the blob
      const response = await api.get(endpoint, {
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      let filename = 'export.xlsx';

      if (type === 'test') {
        filename = `test-results-${timestamp}.xlsx`;
      } else if (type === 'leaderboard') {
        filename = `leaderboard-${timestamp}.xlsx`;
      } else if (type === 'class-report') {
        filename = `class-report-${timestamp}.xlsx`;
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentURL.removeChild(link);

      alert(`Export successful: ${filename}`);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export. Please try again.');
    }
  };

  const getButtonLabel = () => {
    switch (type) {
      case 'test':
        return '📥 Export Test Results';
      case 'leaderboard':
        return '📥 Export Leaderboard';
      case 'class-report':
        return '📥 Export Class Report';
      default:
        return '📥 Export';
    }
  };

  return (
    <button className="btn-export" onClick={handleExport}>
      {getButtonLabel()}
    </button>
  );
}

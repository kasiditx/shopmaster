import { useState, useEffect } from 'react';
import http from '../../api/http';
import './SalesReport.css';

const SalesReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    // Set default date range to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  }, []);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await http.get('/admin/reports/sales', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });
      setReport(response.data);
    } catch (err) {
      setError('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuickRange = (days) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  if (loading) return <div className="loading">Loading report...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="sales-report">
      <div className="report-header">
        <h2>Sales Report</h2>
      </div>

      <div className="date-range-selector">
        <div className="quick-ranges">
          <button onClick={() => handleQuickRange(7)} className="quick-range-btn">
            Last 7 Days
          </button>
          <button onClick={() => handleQuickRange(30)} className="quick-range-btn">
            Last 30 Days
          </button>
          <button onClick={() => handleQuickRange(90)} className="quick-range-btn">
            Last 90 Days
          </button>
        </div>

        <div className="custom-range">
          <div className="date-input-group">
            <label>Start Date:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
            />
          </div>
          <div className="date-input-group">
            <label>End Date:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {report && (
        <>
          <div className="summary-cards">
            <div className="summary-card revenue">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <div className="card-value">${report.totalRevenue?.toFixed(2) || '0.00'}</div>
                <div className="card-label">Total Revenue</div>
              </div>
            </div>

            <div className="summary-card orders">
              <div className="card-icon">📦</div>
              <div className="card-content">
                <div className="card-value">{report.orderCount || 0}</div>
                <div className="card-label">Total Orders</div>
              </div>
            </div>

            <div className="summary-card average">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <div className="card-value">
                  ${report.averageOrderValue?.toFixed(2) || '0.00'}
                </div>
                <div className="card-label">Average Order Value</div>
              </div>
            </div>

            <div className="summary-card products">
              <div className="card-icon">🏆</div>
              <div className="card-content">
                <div className="card-value">{report.topProducts?.length || 0}</div>
                <div className="card-label">Top Products</div>
              </div>
            </div>
          </div>

          {report.topProducts && report.topProducts.length > 0 && (
            <div className="top-products-section">
              <h3>Top Selling Products</h3>
              <div className="top-products-table-container">
                <table className="top-products-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Units Sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topProducts.map((product, index) => (
                      <tr key={product._id}>
                        <td>
                          <span className="rank-badge">#{index + 1}</span>
                        </td>
                        <td>
                          <div className="product-info">
                            {product.images && product.images[0] ? (
                              <img src={product.images[0]} alt={product.name} className="product-thumb" />
                            ) : (
                              <div className="no-image">No image</div>
                            )}
                            <span className="product-name">{product.name}</span>
                          </div>
                        </td>
                        <td>{product.category}</td>
                        <td>
                          <span className="units-sold">{product.totalSold}</span>
                        </td>
                        <td>
                          <span className="revenue">${product.revenue?.toFixed(2) || '0.00'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {report.ordersByStatus && (
            <div className="orders-by-status-section">
              <h3>Orders by Status</h3>
              <div className="status-grid">
                {Object.entries(report.ordersByStatus).map(([status, count]) => (
                  <div key={status} className="status-card">
                    <div className="status-count">{count}</div>
                    <div className="status-label">{status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {report && !report.totalRevenue && (
        <div className="no-data">No sales data available for the selected period</div>
      )}
    </div>
  );
};

export default SalesReport;

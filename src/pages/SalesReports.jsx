import { useMemo } from "react";
import { FaCalendarCheck, FaTrophy, FaCouch, FaFileCsv, FaPrint } from "react-icons/fa";
import "./SalesReports.css";

const sales = [
  { date: "2026-09-10", bookings: 2, tickets: 5, revenue: 79.31 },
  { date: "2026-09-09", bookings: 1, tickets: 2, revenue: 38.5 },
  { date: "2026-09-08", bookings: 1, tickets: 2, revenue: 40.7 },
  { date: "2026-09-07", bookings: 1, tickets: 1, revenue: 24.75 },
];

const topMovies = [
  { title: "Midnight in Venice", tickets: 42, revenue: 620.5 },
  { title: "Interstellar", tickets: 35, revenue: 510.0 },
  { title: "Inception", tickets: 28, revenue: 392.0 },
];

const halls = [
  { name: "Hall 1", occupancy: 78 },
  { name: "Hall 2", occupancy: 64 },
  { name: "VIP Luxury Lounge 3", occupancy: 91 },
];

function downloadCSV(rows) {
  const csv = [
    ["Date", "Bookings Completed", "Tickets Sold", "Gross Revenue", "Average Ticket Value"],
    ...rows.map((row) => [
      row.date,
      row.bookings,
      row.tickets,
      row.revenue.toFixed(2),
      (row.revenue / row.tickets).toFixed(2),
    ]),
  ]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cineverse-sales-report.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function SalesReports() {
  const totalRevenue = useMemo(
    () => sales.reduce((sum, row) => sum + row.revenue, 0),
    []
  );

  return (
    <section className="sales-reports">
      <header className="sales-header">
        <h1>Financial &amp; Sales Analytics Reports</h1>

        <div className="sales-header-actions">
          <button onClick={() => downloadCSV(sales)}>
            <FaFileCsv /> Export CSV
          </button>
          <button className="print-report" onClick={() => window.print()}>
            <FaPrint /> Print Report
          </button>
        </div>
      </header>

      <section className="sales-panel daily-sales">
        <h2>
          <FaCalendarCheck /> Daily Sales Summary (Last 30 Days)
        </h2>

        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bookings Completed</th>
                <th>Total Tickets Sold</th>
                <th>Gross Revenue</th>
                <th>Avg. Ticket Value</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((row) => (
                <tr key={row.date}>
                  <td>{row.date}</td>
                  <td>
                    <span className="sales-count">
                      {row.bookings} {row.bookings === 1 ? "Booking" : "Bookings"}
                    </span>
                  </td>
                  <td>{row.tickets} Seats</td>
                  <td className="sales-revenue">${row.revenue.toFixed(2)}</td>
                  <td>${(row.revenue / row.tickets).toFixed(2)} / seat</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td>{sales.reduce((sum, row) => sum + row.bookings, 0)} bookings</td>
                <td>{sales.reduce((sum, row) => sum + row.tickets, 0)} tickets</td>
                <td className="sales-revenue">${totalRevenue.toFixed(2)}</td>
                <td>—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div className="sales-bottom-grid">
        <section className="sales-panel">
          <h2>
            <FaTrophy /> Top Grossing Movies
          </h2>

          <div className="sales-table-wrap">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Movie</th>
                  <th>Tickets Sold</th>
                  <th>Gross Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topMovies.map((movie) => (
                  <tr key={movie.title}>
                    <td>{movie.title}</td>
                    <td>{movie.tickets}</td>
                    <td className="sales-revenue">${movie.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="sales-panel">
          <h2>
            <FaCouch /> Cinema Hall Occupancy
          </h2>

          <div className="occupancy-list">
            {halls.map((hall) => (
              <div className="occupancy-row" key={hall.name}>
                <div className="occupancy-label">
                  <span>{hall.name}</span>
                  <strong>{hall.occupancy}%</strong>
                </div>
                <div className="occupancy-track">
                  <div
                    className="occupancy-fill"
                    style={{ width: `${hall.occupancy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export default SalesReports;
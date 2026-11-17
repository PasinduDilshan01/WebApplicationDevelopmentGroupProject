import { useEffect, useMemo, useState } from "react";
import {
  FaSearch,
  FaSyncAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import API from "../services/api";
import "./PaymentsManagement.css";

function PaymentsManagement() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch payments from database
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/payments/list.php");

      if (response.data.success) {
        setPayments(response.data.payments);
      } else {
        setError(
          response.data.message || "Failed to load payments."
        );
      }
    } catch (err) {
      console.error("Error fetching payments:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load payment transactions."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load payments when page opens
  useEffect(() => {
    fetchPayments();
  }, []);

  // Search payments
  const filteredPayments = useMemo(() => {
    const searchText = search.toLowerCase();

    return payments.filter((payment) =>
      [
        String(payment.id),
        payment.reference || "",
        payment.bookingReference || "",
        payment.customer || "",
        payment.email || "",
        payment.method || "",
        payment.status || "",
      ].some((value) =>
        value.toLowerCase().includes(searchText)
      )
    );
  }, [payments, search]);

  // Calculate total transactions
  const totalTransactions = payments.length;

  // Calculate successful payments
  const successfulPayments = payments
    .filter(
      (payment) =>
        String(payment.status).toLowerCase() === "completed"
    )
    .reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    );

  // Refresh payments
  const handleRefresh = () => {
    fetchPayments();
  };

  return (
    <div className="payments-management">

      {/* Page Header */}
      <div className="payments-header">
        <div>
          <h2>Payments Management</h2>
          <p>
            View and manage customer payment transactions.
          </p>
        </div>

        <button
          className="payments-refresh-button"
          onClick={handleRefresh}
        >
          <FaSyncAlt />
          Refresh
        </button>
      </div>

      {/* Payment Summary */}
      <div className="payments-summary">

        <div className="payment-summary-card">
          <FaMoneyBillWave />

          <div>
            <h3>{totalTransactions}</h3>
            <p>Total Transactions</p>
          </div>
        </div>

        <div className="payment-summary-card">
          <FaMoneyBillWave />

          <div>
            <h3>
              ${successfulPayments.toFixed(2)}
            </h3>
            <p>Successful Payments</p>
          </div>
        </div>

      </div>

      {/* Search */}
      <div className="payments-toolbar">
        <div className="payments-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Payment Table */}
      {loading ? (
        <p>Loading payments...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (

        <div className="payments-table-container">

          <table className="payments-table">

            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Transaction Reference</th>
                <th>Booking Reference</th>
                <th>Customer</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {filteredPayments.length > 0 ? (

                filteredPayments.map((payment) => {

                  const statusClass = String(
                    payment.status || ""
                  )
                    .toLowerCase()
                    .replace(/\s+/g, "-");

                  return (
                    <tr key={payment.id}>

                      <td>PAY-{payment.id}</td>

                      <td>
                        {payment.reference || "-"}
                      </td>

                      <td>
                        {payment.bookingReference || "-"}
                      </td>

                      <td>
                        <div>{payment.customer}</div>
                        <small>{payment.email}</small>
                      </td>

                      <td>
                        {payment.method || "-"}
                      </td>

                      <td>
                        ${Number(payment.amount || 0).toFixed(2)}
                      </td>

                      <td>
                        <span
                          className={`payment-status ${statusClass}`}
                        >
                          {payment.status || "Unknown"}
                        </span>
                      </td>

                      <td>
                        {payment.date
                          ? new Date(
                              payment.date
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                    </tr>
                  );
                })

              ) : (

                <tr>
                  <td
                    colSpan="8"
                    className="payments-empty"
                  >
                    No payment transactions available.
                  </td>
                </tr>

              )}
            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}

export default PaymentsManagement;
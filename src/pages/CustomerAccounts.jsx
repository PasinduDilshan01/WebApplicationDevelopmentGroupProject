import { useEffect, useMemo, useState } from "react";
import { FaSearch, FaSyncAlt, FaUserSlash, FaCheckCircle } from "react-icons/fa";
import API from "../services/api";
import "./CustomerAccounts.css";

function CustomerAccounts() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/customers/list.php");

      if (response.data.success) {
        setCustomers(response.data.customers);
      } else {
        setError(response.data.message || "Failed to load customers.");
      }
    } catch (err) {
      console.error("Error loading customers:", err);
      setError(
        err.response?.data?.message || "Unable to load customer accounts."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const searchText = search.toLowerCase();

    return customers.filter((customer) =>
      [
        String(customer.id),
        customer.name || "",
        customer.email || "",
        customer.phone || "",
      ].some((value) => value.toLowerCase().includes(searchText))
    );
  }, [customers, search]);

  const refreshCustomers = () => {
    fetchCustomers();
  };

  const handleStatusUpdate = async (customer) => {
  const newStatus =
    customer.status === "Active" ? "Suspended" : "Active";

  const action = newStatus === "Suspended" ? "suspend" : "activate";

  const confirmed = window.confirm(
    `Are you sure you want to ${action} ${customer.name}?`
  );

  if (!confirmed) return;

  try {
    const response = await API.put("/customers/update_status.php", {
      id: customer.id,
      status: newStatus,
    });

    if (response.data.success) {
      alert(response.data.message);
      fetchCustomers();
    } else {
      alert(response.data.message || "Failed to update customer status.");
    }
  } catch (err) {
    console.error("Status update error:", err);
    alert(
      err.response?.data?.message || "Unable to update customer status."
    );
  }
};

  return (
    <div className="customer-accounts">
      <div className="page-header">
        <div>
          <h2>Customer Accounts</h2>
          <p>Manage registered customer accounts.</p>
        </div>

        <button className="refresh-button" onClick={refreshCustomers}>
          <FaSyncAlt /> Refresh
        </button>
      </div>

      <div className="customer-toolbar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p>Loading customers...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Joined</th>
                <th>Bookings</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>CUST-{customer.id}</td>

                    <td>{customer.name}</td>

                    <td>
                      <div>{customer.email}</div>
                      <small>{customer.phone || "No phone number"}</small>
                    </td>

                    <td>
                      {customer.joined
                        ? new Date(customer.joined).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>{Number(customer.bookings || 0)}</td>

                    <td>
                      ${Number(customer.spent || 0).toFixed(2)}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${String(
                          customer.status
                        ).toLowerCase()}`}
                      >
                        {customer.status}
                      </span>
                    </td>

                   <td>
                      {customer.status === "Active" ? (
                      <button
                        className="suspend-button"
                        onClick={() => handleStatusUpdate(customer)}
                      >
                      <FaUserSlash /> Suspend
                    </button>
                  ) : (
                  <button
                    className="activate-button"
                    onClick={() => handleStatusUpdate(customer)}
                    >
                    <FaCheckCircle /> Activate
                  </button>
                  )}
                  </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">
                    No customer accounts found.
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

export default CustomerAccounts;
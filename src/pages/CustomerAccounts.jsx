import { useMemo, useState } from "react";
import { FaSearch, FaSyncAlt, FaUserSlash, FaCheckCircle } from "react-icons/fa";
import "./CustomerAccounts.css";

const sampleCustomers = [
  {
    id: "CUST-19",
    name: "David Miller",
    email: "david.miller@example.com",
    phone: "+1 555-0122",
    joined: "2026-09-04",
    bookings: 1,
    spent: 51.3,
    status: "Active",
  },
  {
    id: "CUST-18",
    name: "Sarah Connor",
    email: "sarah.connor@example.com",
    phone: "+1 555-0188",
    joined: "2026-09-04",
    bookings: 1,
    spent: 40.7,
    status: "Active",
  },
  {
    id: "CUST-17",
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    phone: "+1 555-0134",
    joined: "2026-09-02",
    bookings: 3,
    spent: 89.5,
    status: "Suspended",
  },
];

function CustomerAccounts() {
  const [customers, setCustomers] = useState(sampleCustomers);
  const [search, setSearch] = useState("");

  const filteredCustomers = useMemo(() => {
    const term = search.toLowerCase();

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.id.toLowerCase().includes(term)
    );
  }, [customers, search]);

  const toggleStatus = (customerId) => {
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              status:
                customer.status === "Active" ? "Suspended" : "Active",
            }
          : customer
      )
    );
  };

  const refreshCustomers = () => {
    // Replace this with your API refresh when your backend is ready.
    setCustomers((current) => [...current]);
  };

  return (
    <section className="customer-accounts">
      <header className="customer-header">
        <h1>Registered Customer Accounts</h1>

        <button className="customer-refresh" onClick={refreshCustomers}>
          <FaSyncAlt /> Refresh Customers
        </button>
      </header>

      <div className="customer-filters">
        <label className="customer-search">
          <FaSearch />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
          />
        </label>

        <span className="customer-total">
          Total: {filteredCustomers.length} Customers
        </span>
      </div>

      <div className="customer-table-wrap">
        <table className="customer-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Contact Information</th>
              <th>Joined Date</th>
              <th>Total Bookings</th>
              <th>Total Spent</th>
              <th>Account Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <div className="customer-name-cell">
                    <span className="customer-avatar">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>

                    <div>
                      <strong>{customer.name}</strong>
                      <span className="customer-subtext">ID: #{customer.id}</span>
                    </div>
                  </div>
                </td>

                <td>
                  <span>{customer.email}</span>
                  <span className="customer-subtext">{customer.phone}</span>
                </td>

                <td>{customer.joined}</td>

                <td>
                  <span className="customer-bookings">
                    {customer.bookings}{" "}
                    {customer.bookings === 1 ? "Booking" : "Bookings"}
                  </span>
                </td>

                <td className="customer-spent">
                  ${customer.spent.toFixed(2)}
                </td>

                <td>
                  <span
                    className={`customer-status ${customer.status.toLowerCase()}`}
                  >
                    <FaCheckCircle /> {customer.status}
                  </span>
                </td>

                <td>
                  <button
                    className={`customer-status-button ${
                      customer.status === "Active" ? "suspend" : "activate"
                    }`}
                    onClick={() => toggleStatus(customer.id)}
                  >
                    {customer.status === "Active" ? (
                      <>
                        <FaUserSlash /> Suspend
                      </>
                    ) : (
                      <>
                        <FaCheckCircle /> Activate
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}

            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="7" className="customer-empty">
                  No customers match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default CustomerAccounts;
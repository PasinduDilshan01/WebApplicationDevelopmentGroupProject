import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch, FaTrash, FaEdit, FaFilm } from "react-icons/fa";
import API from "../services/api";
import "./CinemaHallManagement.css";

function CinemaHallManagement() {
  const [halls, setHalls] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingHallId, setEditingHallId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    total_seats: "",
    hall_type: "Standard",
    status: "Active",
  });

  // LOAD CINEMA HALLS FROM MYSQL
  const fetchHalls = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/halls/list.php");

      if (response.data.success) {
        setHalls(response.data.halls);
      } else {
        setError(response.data.message || "Unable to load cinema halls.");
      }
    } catch (err) {
      console.error("Load halls error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHalls();
  }, []);

  // SEARCH CINEMA HALLS
  const filteredHalls = useMemo(() => {
    return halls.filter((hall) =>
      (hall.name || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [halls, search]);

  // RESET FORM
  const resetForm = () => {
    setForm({
      name: "",
      total_seats: "",
      hall_type: "Standard",
      status: "Active",
    });

    setEditingHallId(null);
  };

  // OPEN ADD FORM
  const openAddForm = () => {
    setError("");
    resetForm();
    setShowForm(true);
  };

  // OPEN EDIT FORM
  const handleEdit = (hall) => {
    setError("");

    setEditingHallId(hall.id);

    setForm({
      name: hall.name,
      total_seats: hall.total_seats,
      hall_type: hall.hall_type,
      status: hall.status,
    });

    setShowForm(true);
  };

  // ADD OR UPDATE CINEMA HALL
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const hallData = {
        name: form.name.trim(),
        total_seats: Number(form.total_seats),
        hall_type: form.hall_type,
        status: form.status,
      };

      let response;

      if (editingHallId !== null) {
        // UPDATE EXISTING HALL
        response = await API.put("/halls/update.php", {
          id: editingHallId,
          ...hallData,
        });
      } else {
        // ADD NEW HALL
        response = await API.post("/halls/create.php", hallData);
      }

      if (response.data.success) {
        alert(
          editingHallId !== null
            ? "Cinema hall updated successfully!"
            : "Cinema hall added successfully!"
        );

        setShowForm(false);
        resetForm();

        await fetchHalls();
      } else {
        setError(
          response.data.message || "Unable to save cinema hall."
        );
      }
    } catch (err) {
      console.error("Save hall error:", err);
      console.error("Server response:", err.response?.data);

      setError(
        err.response?.data?.message ||
        "Unable to save cinema hall."
      );
    } finally {
      setSaving(false);
    }
  };

 // DELETE CINEMA HALL FROM MYSQL
const handleDelete = async (id) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this cinema hall?"
  );

  if (!confirmed) return;

  try {
    setError("");

    const response = await API.delete("/halls/delete.php", {
      data: { id },
    });

    if (response.data.success) {
      alert("Cinema hall deleted successfully!");
      await fetchHalls();
    } else {
      setError(
        response.data.message || "Unable to delete cinema hall."
      );
    }

  } catch (err) {
    console.error("Delete hall error:", err);
    console.error("Server response:", err.response?.data);

    setError(
      err.response?.data?.message ||
      "Unable to delete cinema hall."
    );
  }
};
  return (
    <section className="hall-management">

      <header className="hall-management-header">
        <h1>Cinema Hall Management</h1>

        <button
          className="add-hall-button"
          onClick={openAddForm}
        >
          <FaPlus /> Add New Hall
        </button>
      </header>

      <div className="hall-filters">

        <label className="hall-search">
          <FaSearch />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cinema halls..."
          />
        </label>

        <span className="hall-total">
          Total: {filteredHalls.length} Halls
        </span>

      </div>

      {error && (
        <p className="hall-error">
          {error}
        </p>
      )}

      <div className="hall-table-wrapper">

        <table className="hall-table">

          <thead>
            <tr>
              <th>Hall ID</th>
              <th>Hall Name</th>
              <th>Total Seats</th>
              <th>Hall Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td colSpan="6" className="hall-empty">
                  Loading cinema halls...
                </td>
              </tr>
            ) : filteredHalls.length > 0 ? (

              filteredHalls.map((hall) => (

                <tr key={hall.id}>

                  <td>#{hall.id}</td>

                  <td className="hall-name">
                    <FaFilm />
                    {hall.name}
                  </td>

                  <td>{hall.total_seats} Seats</td>

                  <td>{hall.hall_type}</td>

                  <td>
                    <span
                      className={`hall-status ${
                        hall.status === "Active"
                          ? "hall-active"
                          : "hall-inactive"
                      }`}
                    >
                      {hall.status}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="hall-edit-button"
                      onClick={() => handleEdit(hall)}
                      title="Edit hall"
                    >
                      <FaEdit />
                    </button>

                    <button
                      type="button"
                      className="hall-delete-button"
                      onClick={() => handleDelete(hall.id)}
                      title="Delete hall"
                    >
                      <FaTrash />
                    </button>
                  </td>

                </tr>

              ))

            ) : (

              <tr>
                <td colSpan="6" className="hall-empty">
                  No cinema halls found.
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* ADD / EDIT CINEMA HALL MODAL */}
      {showForm && (

        <div className="hall-modal-backdrop">

          <form
            className="hall-form"
            onSubmit={handleSubmit}
          >

            <h2>
              {editingHallId !== null
                ? "Edit Cinema Hall"
                : "Add New Cinema Hall"}
            </h2>

            <label>Hall Name</label>

            <input
              required
              placeholder="Enter hall name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <label>Total Seats</label>

            <input
              required
              type="number"
              min="1"
              placeholder="Enter seating capacity"
              value={form.total_seats}
              onChange={(e) =>
                setForm({ ...form, total_seats: e.target.value })
              }
            />

            <label>Hall Type</label>

            <select
              value={form.hall_type}
              onChange={(e) =>
                setForm({ ...form, hall_type: e.target.value })
              }
            >
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="IMAX">IMAX</option>
              <option value="VIP">VIP</option>
            </select>

            <label>Status</label>

            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value })
              }
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div className="hall-form-actions">

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                  setError("");
                }}
                disabled={saving}
              >
                Cancel
              </button>

              <button type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingHallId !== null
                    ? "Update Hall"
                    : "Add Hall"}
              </button>

            </div>

          </form>

        </div>

      )}

    </section>
  );
}

export default CinemaHallManagement;
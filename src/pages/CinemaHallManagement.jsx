import { useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaTrash,
  FaEdit,
  FaFilm,
  FaMinus
} from "react-icons/fa";

import API from "../services/api";
import "./CinemaHallManagement.css";

const createDefaultLayout = () => [
  { row: "A", seats: 10 },
  { row: "B", seats: 10 },
  { row: "C", seats: 10 },
  { row: "D", seats: 10 },
  { row: "E", seats: 10 }
];

function getRowName(index) {
  let name = "";
  let number = index + 1;

  while (number > 0) {
    number--;
    name = String.fromCharCode(65 + (number % 26)) + name;
    number = Math.floor(number / 26);
  }

  return name;
}

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
    hall_type: "Standard",
    status: "Active"
  });

  const [seatLayout, setSeatLayout] = useState(
    createDefaultLayout()
  );

  // Calculate total seats automatically
  const totalSeats = useMemo(() => {
    return seatLayout.reduce(
      (total, row) => total + Number(row.seats || 0),
      0
    );
  }, [seatLayout]);

  // LOAD CINEMA HALLS
  const fetchHalls = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/halls/list.php");

      if (response.data.success) {
        setHalls(response.data.halls);
      } else {
        setError(
          response.data.message || "Unable to load cinema halls."
        );
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
      (hall.name || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [halls, search]);

  // RESET FORM
  const resetForm = () => {
    setForm({
      name: "",
      hall_type: "Standard",
      status: "Active"
    });

    setSeatLayout(createDefaultLayout());
    setEditingHallId(null);
  };

  // OPEN ADD FORM
  const openAddForm = () => {
    setError("");
    resetForm();
    setShowForm(true);
  };

  // OPEN EDIT FORM
  const handleEdit = async (hall) => {
    setError("");

    setEditingHallId(hall.id);

    setForm({
      name: hall.name,
      hall_type: hall.hall_type,
      status: hall.status
    });

    try {
      // This endpoint will be created in the next backend step.
      const response = await API.get(
        `/halls/seats.php?hall_id=${hall.id}`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Unable to load hall seats."
        );
      }

      setSeatLayout(response.data.seat_layout);
      setShowForm(true);

    } catch (err) {
      console.error("Load hall seats error:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load this hall's seat layout."
      );
    }
  };

  // ADD NEW ROW
  const addRow = () => {
    if (seatLayout.length >= 50) {
      setError("Maximum 50 rows are allowed.");
      return;
    }

    setError("");

    setSeatLayout((previous) => [
      ...previous,
      {
        row: getRowName(previous.length),
        seats: 10
      }
    ]);
  };

  // REMOVE ROW
  const removeRow = (index) => {
    if (seatLayout.length <= 1) {
      setError("A cinema hall must have at least one row.");
      return;
    }

    setError("");

    setSeatLayout((previous) => {
      const updated = previous.filter(
        (_, rowIndex) => rowIndex !== index
      );

      return updated.map((row, rowIndex) => ({
        ...row,
        row: getRowName(rowIndex)
      }));
    });
  };

  // CHANGE SEAT COUNT
  const updateRowSeats = (index, value) => {
    const count = value === "" ? "" : Number(value);

    setSeatLayout((previous) =>
      previous.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, seats: count }
          : row
      )
    );
  };

  // SAVE HALL
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (seatLayout.length === 0 || totalSeats <= 0) {
        setError("Please create a valid seat layout.");
        return;
      }

      if (
        seatLayout.some(
          (row) =>
            !Number.isInteger(Number(row.seats)) ||
            Number(row.seats) < 1 ||
            Number(row.seats) > 50
        )
      ) {
        setError("Each row must contain between 1 and 50 seats.");
        return;
      }

      if (totalSeats > 500) {
        setError("Maximum seating capacity is 500 seats.");
        return;
      }

      const hallData = {
        name: form.name.trim(),
        total_seats: totalSeats,
        hall_type: form.hall_type,
        status: form.status,
        seat_layout: seatLayout.map((row) => ({
          row: row.row,
          seats: Number(row.seats)
        }))
      };

      let response;

      if (editingHallId !== null) {
        response = await API.put("/halls/update.php", {
          id: editingHallId,
          ...hallData
        });
      } else {
        response = await API.post(
          "/halls/create.php",
          hallData
        );
      }

      if (response.data.success) {
        alert(
          editingHallId !== null
            ? "Cinema hall updated successfully!"
            : "Cinema hall and seat layout created successfully!"
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

  // DELETE CINEMA HALL
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this cinema hall?"
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await API.delete(
        "/halls/delete.php",
        { data: { id } }
      );

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

      setError(
        err.response?.data?.message ||
        "Unable to delete cinema hall."
      );
    }
  };

  return (
    <section className="hall-management">

      {/* HEADER */}
      <header className="hall-management-header">

        <h1>Cinema Hall Management</h1>

        <button
          className="add-hall-button"
          onClick={openAddForm}
        >
          <FaPlus /> Add New Hall
        </button>

      </header>

      {/* SEARCH */}
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
        <p className="hall-error">{error}</p>
      )}

      {/* HALL TABLE */}
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

      {/* ADD / EDIT HALL MODAL */}
      {showForm && (

        <div className="hall-modal-backdrop">

          <form
            className="hall-form hall-layout-form"
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
                setForm({
                  ...form,
                  name: e.target.value
                })
              }
            />

            <label>Hall Type</label>

            <select
              value={form.hall_type}
              onChange={(e) =>
                setForm({
                  ...form,
                  hall_type: e.target.value
                })
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
                setForm({
                  ...form,
                  status: e.target.value
                })
              }
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* SEAT LAYOUT EDITOR */}
            <div className="seat-layout-editor">

              <div className="seat-layout-heading">

                <div>
                  <h3>Seat Layout Customization</h3>
                  <p>Customize the seats in each row.</p>
                </div>

                <button
                  type="button"
                  className="add-layout-row"
                  onClick={addRow}
                >
                  <FaPlus /> Add Row
                </button>

              </div>

              {/* ROW SETTINGS */}
              <div className="layout-row-list">

                {seatLayout.map((row, index) => (

                  <div
                    className="layout-row-item"
                    key={row.row}
                  >

                    <div className="layout-row-name">
                      Row {row.row}
                    </div>

                    <div className="layout-seat-input">

                      <label>
                        Number of Seats
                      </label>

                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={row.seats}
                        onChange={(e) =>
                          updateRowSeats(index, e.target.value)
                        }
                        required
                      />

                    </div>

                    <button
                      type="button"
                      className="remove-layout-row"
                      onClick={() => removeRow(index)}
                      title="Remove row"
                    >
                      <FaMinus />
                    </button>

                  </div>

                ))}

              </div>

              {/* TOTAL SEATS */}
              <div className="layout-total">
                <span>Total Seating Capacity</span>
                <strong>{totalSeats} Seats</strong>
              </div>

              {/* LIVE PREVIEW */}
              <div className="seat-layout-preview">

                <h4>Seat Layout Preview</h4>

                <div className="preview-screen">
                  SCREEN
                </div>

                <div className="preview-seat-rows">

                  {seatLayout.map((row) => (

                    <div
                      className="preview-seat-row"
                      key={row.row}
                    >

                      <span className="preview-row-label">
                        {row.row}
                      </span>

                      <div className="preview-seats">

                        {Array.from(
                          { length: Number(row.seats) || 0 },
                          (_, index) => (

                            <div
                              className="preview-seat"
                              key={`${row.row}${index + 1}`}
                              title={`${row.row}${index + 1}`}
                            >
                              {row.row}{index + 1}
                            </div>

                          )
                        )}

                      </div>

                    </div>

                  ))}

                </div>

              </div>

            </div>

            {/* HALL STATUS */}
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
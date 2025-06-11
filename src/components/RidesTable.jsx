import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSortUp,
  faSortDown,
  faSort,
} from "@fortawesome/free-solid-svg-icons";

// Helper function to format duration (e.g., "2h 30m" from "2h 30m")
const formatDuration = (duration) => {
  if (!duration) return "0h 0m";
  // Assuming duration is already in "Xh Ym" format or similar.
  // If it's in minutes, you'd convert it:
  // const totalMinutes = parseInt(duration, 10);
  // const hours = Math.floor(totalMinutes / 60);
  // const minutes = totalMinutes % 60;
  // return `${hours}h ${minutes}m`;
  return duration;
};

const RidesTable = ({ rides, onViewCard }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "descending",
  });
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10; // Number of items per page in the table

  // Filtered and Sorted Rides
  const filteredRides = rides.filter((ride) =>
    ride.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedRides = [...filteredRides].sort((a, b) => {
    if (sortConfig.key === "date") {
      // Assuming date is in a sortable string format like "YYYY-MM-DD" or comparable
      // If date is like "Mon, 6/8/2025", you'd need to parse it to a Date object first.
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA < dateB) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (dateA > dateB) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    } else if (sortConfig.key === "title") {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();
      if (titleA < titleB) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (titleA > titleB) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    } else if (sortConfig.key in a.stats) {
      // Handle numeric stats like distance, elevation, avgSpeed
      const valueA = parseFloat(a.stats[sortConfig.key]);
      const valueB = parseFloat(b.stats[sortConfig.key]);
      if (valueA < valueB) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedRides.length / itemsPerPage);
  const paginatedRides = sortedRides.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FontAwesomeIcon icon={faSort} className="sort-icon inactive" />;
    }
    if (sortConfig.direction === "ascending") {
      return <FontAwesomeIcon icon={faSortUp} className="sort-icon active" />;
    }
    return <FontAwesomeIcon icon={faSortDown} className="sort-icon active" />;
  };

  return (
    <div className="rides-table-container">
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(0); // Reset to first page on search
          }}
          className="search-input"
        />
      </div>

      <div className="table-wrapper">
        <table className="rides-table">
          <thead>
            <tr>
              <th onClick={() => requestSort("date")}>
                Date {getSortIcon("date")}
              </th>
              <th onClick={() => requestSort("title")}>
                Title {getSortIcon("title")}
              </th>
              <th onClick={() => requestSort("duration")}>
                Time {getSortIcon("duration")}
              </th>
              <th onClick={() => requestSort("distance")}>
                Distance {getSortIcon("distance")}
              </th>
              <th onClick={() => requestSort("elevation")}>
                Elevation {getSortIcon("elevation")}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRides.length > 0 ? (
              paginatedRides.map((ride) => (
                <tr
                  key={ride.id}
                  onClick={() => onViewCard(ride.id)}
                  className="table-row-clickable"
                >
                  <td>{ride.date}</td>
                  <td>{ride.title}</td>
                  <td>{formatDuration(ride.stats.duration)}</td>
                  <td>{ride.stats.distance?.toFixed(2) || "0.00"} km</td>
                  <td>{ride.stats.elevation?.toFixed(0) || "0"} m</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-results">
                  No rides found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Controls */}
      {sortedRides.length > itemsPerPage && (
        <div className="table-pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            Prev
          </button>
          <span className="current-page-info">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
            }
            disabled={currentPage === totalPages - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

RidesTable.propTypes = {
  rides: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      stats: PropTypes.shape({
        distance: PropTypes.number,
        duration: PropTypes.string,
        avgSpeed: PropTypes.number,
        elevation: PropTypes.number,
      }),
    })
  ).isRequired,
  onViewCard: PropTypes.func.isRequired,
};

export default RidesTable;

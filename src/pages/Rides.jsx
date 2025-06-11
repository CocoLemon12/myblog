import React, { useState, useEffect } from "react";
import RidePost from "../components/RidePost";
import RidesTable from "../components/RidesTable";
import LoadingTrivia from "../components/LoadingTrivia";
import "../styles/Rides.css";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

function Rides() {
  const [allRideData, setAllRideData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentRideId, setCurrentRideId] = useState(null);
  const [showTableView, setShowTableView] = useState(false);

  useEffect(() => {
    const fetchAllRideData = async () => {
      setLoading(true);
      setError(null);
      try {
        const postsCollectionRef = collection(db, "posts");
        const q = query(postsCollectionRef, orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);

        const fetchedData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          date: doc.data().date,
          title: doc.data().title,
          stats: doc.data().stats || {},
        }));

        setAllRideData(fetchedData);
        if (fetchedData.length > 0) {
          setCurrentRideId(fetchedData[0].id);
        }
      } catch (err) {
        console.error("Error fetching all ride data:", err);
        setError("Failed to load ride list.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllRideData();
  }, []);

  const handlePrevClick = () => {
    const currentIndex = allRideData.findIndex(
      (ride) => ride.id === currentRideId
    );
    if (currentIndex > 0) {
      setCurrentRideId(allRideData[currentIndex - 1].id);
    }
  };

  const handleNextClick = () => {
    const currentIndex = allRideData.findIndex(
      (ride) => ride.id === currentRideId
    );
    if (currentIndex < allRideData.length - 1) {
      setCurrentRideId(allRideData[currentIndex + 1].id);
    }
  };

  const handleViewAllRidesClick = () => {
    setShowTableView(true);
  };

  const handleViewCardClick = (id) => {
    setCurrentRideId(id);
    setShowTableView(false);
  };

  const currentRideIndex = allRideData.findIndex(
    (ride) => ride.id === currentRideId
  );

  if (loading) {
    return <LoadingTrivia />;
  }

  if (error) {
    return <div className="rides-container error">Error: {error}</div>;
  }

  return (
    <div className="rides-container">
      <h1 className="rides-title">My Cycling Adventures</h1>

      {showTableView ? (
        <>
          <RidesTable rides={allRideData} onViewCard={handleViewCardClick} />
          <button
            className="back-to-card-btn"
            onClick={() => setShowTableView(false)}
          >
            Back to Current Ride
          </button>
        </>
      ) : (
        <>
          <div className="rides-list">
            {currentRideId ? (
              <RidePost key={currentRideId} id={currentRideId} />
            ) : (
              <p>No rides available at the moment.</p>
            )}
          </div>

          {allRideData.length > 0 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={handlePrevClick}
                disabled={currentRideIndex === 0}
              >
                Prev
              </button>

              <span className="current-ride-info">
                {currentRideId
                  ? `${currentRideIndex + 1} / ${allRideData.length}`
                  : "N/A"}
              </span>

              <button
                className="pagination-btn"
                onClick={handleNextClick}
                disabled={currentRideIndex === allRideData.length - 1}
              >
                Next
              </button>
            </div>
          )}

          <button
            className="view-all-rides-btn"
            onClick={handleViewAllRidesClick}
          >
            View All Rides
          </button>
        </>
      )}
    </div>
  );
}

export default Rides;

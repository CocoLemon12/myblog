import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "../styles/RidePost.css"; // Ensure this CSS file exists
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { db } from "../firebase/config"; // Import your Firestore instance
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRoute,
  faClock,
  faTachometerAlt,
  faMountain,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { loadTrackChunks } from "../utils/trackUtils";

const RidePost = ({ id }) => {
  // Now only needs the 'id' prop
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false); // For intersection observer animation
  const [postData, setPostData] = useState(null); // State to hold fetched post data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullTrackData, setFullTrackData] = useState(null); // New state for full track data

  // Default stats to ensure they always exist and have numeric values
  const defaultStats = {
    distance: 0,
    duration: "0h 0m",
    avgSpeed: 0,
    elevation: 0,
  };

  // Fetch post data from Firestore
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        setError("No post ID provided.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const postRef = doc(db, "posts", id);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
          const data = postSnap.data();
          setPostData({ id: postSnap.id, ...data });
        } else {
          setError("Post not found.");
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Failed to load post data.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]); // Re-fetch if ID changes

  // Derive display data from postData
  const title = postData?.title || "Loading Title...";
  const description = postData?.description || "";
  const images = postData?.images || [];
  const date = postData?.date || "N/A";
  const stats = postData?.stats || {};
  const trackData = postData?.trackData || null;

  const displayStats = {
    ...defaultStats,
    distance: Number(stats?.distance) || 0,
    duration: stats?.duration || "0h 0m",
    avgSpeed: Number(stats?.avgSpeed) || 0,
    elevation: Number(stats?.elevation) || 0,
  };

  // Intersection Observer for fade-in animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const currentMapContainer = mapContainer.current;
    if (currentMapContainer) {
      // Find the closest ancestor with 'ride-post' class
      const postElement = currentMapContainer.closest(".ride-post");
      if (postElement) {
        observer.observe(postElement);
      }
    }

    return () => {
      if (currentMapContainer) {
        const postElement = currentMapContainer.closest(".ride-post");
        if (postElement) {
          observer.unobserve(postElement);
        }
      }
    };
  }, []);

  // Image navigation handlers
  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Keyboard navigation for images
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [images, currentImageIndex]);

  // Process track data into GeoJSON format when trackData is available
  useEffect(() => {
    const loadAndProcessTrackData = async () => {
      if (!isMapVisible || !trackData) return;

      try {
        let allPoints = [];

        // Handle chunked data
        if (trackData.metadata?.totalChunks) {
          console.log("Loading chunked track data...");

          // Add first chunk - check both track and previewChunk
          const firstChunk = trackData.track || trackData.previewChunk;
          if (firstChunk) {
            console.log("Adding first chunk:", firstChunk.length);
            allPoints = [...firstChunk];
          }

          // Load additional chunks
          const additionalPoints = await loadTrackChunks(
            db,
            id,
            trackData.metadata
          );
          if (additionalPoints?.length > 0) {
            console.log("Adding additional chunks:", additionalPoints.length);
            allPoints = [...allPoints, ...additionalPoints];
          }

          const totalPoints = allPoints.length;
          console.log("Total points combined:", totalPoints);

          if (totalPoints !== trackData.metadata.totalPoints) {
            console.warn(
              `Point count mismatch: got ${totalPoints}, expected ${trackData.metadata.totalPoints}`
            );
          }
        } else if (trackData.track?.length > 0) {
          // Handle non-chunked data
          console.log("Using complete track data:", trackData.track.length);
          allPoints = trackData.track;
        }

        // Process the points into GeoJSON
        if (allPoints.length > 0) {
          const coordinates = allPoints.map((point) => [
            parseFloat(point.lng),
            parseFloat(point.lat),
          ]);

          setGeoJsonData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: coordinates,
                },
              },
            ],
          });

          setFullTrackData(allPoints);
        }
      } catch (error) {
        console.error("Error processing track data:", error);
        setGeoJsonData(null);
      }
    };

    loadAndProcessTrackData();
  }, [isMapVisible, trackData, id]);

  // Initialize and manage Mapbox map
  useEffect(() => {
    if (!isMapVisible || !mapContainer.current || !geoJsonData) {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setIsMapLoaded(false);
      }
      return;
    }

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    if (!map.current) {
      const coordinates = geoJsonData.features[0].geometry.coordinates;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/outdoors-v12",
        center: coordinates[0],
        zoom: 12,
        interactive: true,
      });

      map.current.on("load", () => {
        if (map.current.getSource("route")) {
          map.current.removeLayer("route");
          map.current.removeSource("route");
        }

        map.current.addSource("route", {
          type: "geojson",
          data: geoJsonData,
        });

        map.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#ff0000",
            "line-width": 3,
          },
        });

        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current.fitBounds(bounds, {
          padding: 50,
          duration: 0,
        });

        setIsMapLoaded(true);
      });

      map.current.on("resize", () => {
        map.current.fitBounds(map.current.getBounds(), {
          padding: 50,
          duration: 0,
        });
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setIsMapLoaded(false);
      }
    };
  }, [isMapVisible, geoJsonData]);

  const handleMapToggle = () => {
    setIsMapVisible((prev) => !prev);
    if (!isMapVisible) {
      setCurrentImageIndex(0); // Reset image index when showing map
      setIsMapLoaded(false);
    }
  };

  if (loading) {
    return <div className="ride-post loading">Loading ride...</div>;
  }

  if (error) {
    return <div className="ride-post error">Error: {error}</div>;
  }

  if (!postData) {
    return <div className="ride-post not-found">Ride data not available.</div>;
  }

  return (
    <div className={`ride-post ${isVisible ? "fade-in-up" : ""}`}>
      <div className="post-header">
        <div className="post-meta">
          <span className="post-date">{date}</span>
        </div>
        <h2 className="post-title">{title}</h2>
      </div>

      {description && (
        <div className="post-description">
          <p>{description}</p>
        </div>
      )}

      {images && images.length > 0 && (
        <div className="post-image-carousel">
          <img
            src={images[currentImageIndex]}
            alt={`${title} - ${currentImageIndex + 1}`}
            loading="lazy"
            className="main-image"
          />
          {images.length > 1 && (
            <>
              <button
                className="nav-button prev"
                onClick={handlePrevImage}
                aria-label="Previous image"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <button
                className="nav-button next"
                onClick={handleNextImage}
                aria-label="Next image"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
              <div className="image-counter">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}

      <div className="route-stats">
        <div className="stat-item" title="Total Distance">
          <div className="stat-icon-wrapper">
            <FontAwesomeIcon icon={faRoute} />
            <span className="stat-tooltip">Total Distance</span>
          </div>
          <span>{displayStats.distance.toFixed(2)} km</span>
        </div>
        <div className="stat-item" title="Total Duration">
          <div className="stat-icon-wrapper">
            <FontAwesomeIcon icon={faClock} />
            <span className="stat-tooltip">Total Duration</span>
          </div>
          <span>{displayStats.duration}</span>
        </div>
        <div className="stat-item" title="Average Speed">
          <div className="stat-icon-wrapper">
            <FontAwesomeIcon icon={faTachometerAlt} />
            <span className="stat-tooltip">Average Speed</span>
          </div>
          <span>{displayStats.avgSpeed.toFixed(2)} km/h</span>
        </div>
        <div className="stat-item" title="Total Elevation">
          <div className="stat-icon-wrapper">
            <FontAwesomeIcon icon={faMountain} />
            <span className="stat-tooltip">Total Elevation</span>
          </div>
          <span>{displayStats.elevation.toFixed(0)}m</span>
        </div>
      </div>

      {/* Map section - only show toggle if trackData exists */}
      {trackData && trackData.track && trackData.track.length > 0 && (
        <div className="map-section">
          <button className="show-path-button" onClick={handleMapToggle}>
            {isMapVisible ? "Hide Path" : "Show Path"}
          </button>
          {isMapVisible && (
            <div
              ref={mapContainer}
              className="map-container"
              style={{
                height: "400px",
                width: "100%",
              }}
            >
              {!isMapLoaded && (
                <div className="map-loading">Loading map...</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

RidePost.propTypes = {
  id: PropTypes.string.isRequired,
};

RidePost.defaultProps = {
  id: "",
};

export default RidePost;

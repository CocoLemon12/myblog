import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "../styles/BikePost.css";
import PhotoUploader from "./PhotoUploader";
import {
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import EditPostForm from "./EditPostForm";
import { convertGpxToGeoJson } from "../utils/gpxUtils";
import {
  splitTrackData,
  saveTrackChunks,
  loadTrackChunks,
} from "../utils/trackUtils";

const defaultStats = {
  distance: 0,
  duration: "0h 0m",
  avgSpeed: 0,
  elevation: 0,
};

const validateGeoJson = (geoJson) => {
  return (
    geoJson &&
    geoJson.features &&
    Array.isArray(geoJson.features) &&
    geoJson.features[0]?.geometry?.coordinates?.length > 0
  );
};

const CHUNK_SIZE = 500; // Number of track points per chunk
const MAX_DOCUMENT_SIZE = 1000000; // ~1MB in bytes

const BikePost = ({
  id,
  date,
  title,
  images,
  stats,
  trackData,
  description,
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [post, setPost] = useState({
    title,
    description,
    date,
    images: images || [],
    stats: {
      distance: stats?.distance || 0,
      duration: stats?.duration || "0h 0m",
      avgSpeed: stats?.avgSpeed || 0,
      elevation: stats?.elevation || 0,
      stravaId: stats?.stravaId || "",
    },
    trackData: null, // We'll handle this separately
  });
  const [imageArray, setImageArray] = useState(images || []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [postStats, setPostStats] = useState(stats);
  const [isEditing, setIsEditing] = useState(false);
  const [trackPoints, setTrackPoints] = useState([]);
  // Add new state for track data
  const [fullTrackData, setFullTrackData] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const postElement = document.querySelector(".bike-post");
    if (postElement) {
      observer.observe(postElement);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      if (!id) {
        console.warn("No post ID provided");
        return;
      }

      try {
        const postRef = doc(db, "posts", id);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
          const data = postSnap.data();
          if (data.images && Array.isArray(data.images)) {
            setImageArray(data.images);
          }
        }
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImages();
  }, [id]);

  const handlePrevImage = () => {
    const newIndex =
      currentImageIndex === 0 ? imageArray.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(newIndex);
  };

  const handleNextImage = () => {
    const newIndex =
      currentImageIndex === imageArray.length - 1 ? 0 : currentImageIndex + 1;
    setCurrentImageIndex(newIndex);
  };

  // Update handleEditSave function
  const handleEditSave = async (updatedData) => {
    try {
      if (!id) throw new Error("Missing post ID");

      // Ensure stats are properly formatted
      const sanitizedData = {
        ...updatedData,
        stats: {
          distance: Number(updatedData.stats?.distance) || 0,
          duration: updatedData.stats?.duration || "0h 0m",
          avgSpeed: Number(updatedData.stats?.avgSpeed) || 0,
          elevation: Number(updatedData.stats?.elevation) || 0,
          stravaId: updatedData.stats?.stravaId || "",
        },
      };

      if (updatedData.trackData?.track) {
        const splitData = splitTrackData(updatedData.trackData);

        // Save main document with preview chunk
        const mainData = {
          ...sanitizedData,
          trackData: {
            metadata: splitData.metadata,
            track: splitData.previewChunk,
          },
        };

        await setDoc(doc(db, "posts", id), mainData, { merge: true });

        // Save remaining chunks
        if (splitData.chunks.length > 0) {
          await saveTrackChunks(db, id, splitData);
        }
      } else {
        await setDoc(doc(db, "posts", id), sanitizedData, { merge: true });
      }

      // Update local state
      setPost(sanitizedData);
      setPostStats(sanitizedData.stats);

      return true;
    } catch (error) {
      console.error("Error saving post:", error);
      return false;
    }
  };

  const handleUploadComplete = async (newPhotos) => {
    if (!id) {
      console.error("Cannot upload: No post ID provided");
      return;
    }

    try {
      // Update Firebase
      const postRef = doc(db, "posts", id);
      await updateDoc(postRef, {
        images: arrayUnion(...newPhotos),
      });

      // Update local state
      setImageArray((prevImages) => [...prevImages, ...newPhotos]);
    } catch (error) {
      console.error("Error saving to Firebase:", error);
    }
  };

  // Validate id before using it
  useEffect(() => {
    if (!id || typeof id !== "string") {
      console.error("BikePost: Invalid or missing id prop");
      return;
    }
  }, [id]);

  // Add validation for stats before rendering
  useEffect(() => {
    if (!stats || typeof stats !== "object") {
      console.warn("Invalid stats object, using defaults");
      setPostStats(defaultStats);
    } else {
      setPostStats(stats);
    }
  }, [stats]);

  // Update the loadTrackData function
  const loadTrackData = async () => {
    try {
      // If we already have the full track data in memory, use it
      if (fullTrackData) {
        return fullTrackData;
      }

      // If trackData has chunks, load all chunks
      if (trackData?.metadata?.totalChunks) {
        console.log("Loading chunked track data...");
        let allPoints = [];

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

        return allPoints;
      }

      // If trackData has complete track and no chunks, use it directly
      if (trackData?.track?.length > 0) {
        console.log("Using complete track data:", trackData.track.length);
        return trackData.track;
      }

      return null;
    } catch (error) {
      console.error("Error loading track data:", error);
      return null;
    }
  };

  // Move track data processing into a separate useEffect that only runs when map is visible
  useEffect(() => {
    const loadAndProcessTrackData = async () => {
      if (!isMapVisible || fullTrackData) return; // Skip if map is hidden or data already loaded

      try {
        const points = await loadTrackData();
        if (!points || points.length === 0) {
          console.warn("No track points available");
          return;
        }

        console.log(`Successfully loaded ${points.length} total track points`);
        setFullTrackData(points);

        const coordinates = points.map((point) => [
          parseFloat(point.lng),
          parseFloat(point.lat),
        ]);

        const geoJson = {
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
        };

        setGeoJsonData(geoJson);
      } catch (error) {
        console.error("Error processing track data:", error);
      }
    };

    loadAndProcessTrackData();
  }, [isMapVisible, id]); // Only run when map visibility changes

  // Initialize map
  useEffect(() => {
    console.log("Map init debug:", {
      isMapVisible,
      hasContainer: !!mapContainer.current,
      hasGeoJson: !!geoJsonData,
      containerHeight: mapContainer.current?.clientHeight,
      coordinates: geoJsonData?.features[0]?.geometry?.coordinates,
    });

    if (!isMapVisible || !mapContainer.current || !geoJsonData) return;

    try {
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
          console.log("Map loaded, adding route");

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

          // Fit bounds to route
          const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
          }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

          map.current.fitBounds(bounds, {
            padding: 50,
          });

          // Set map as loaded after everything is done
          setIsMapLoaded(true);
        });
      }
    } catch (error) {
      console.error("Map initialization error:", error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setIsMapLoaded(false);
      }
    };
  }, [isMapVisible, geoJsonData]);

  const handleKeyPress = (e) => {
    if (e.key === "ArrowLeft") {
      handlePrevImage();
    } else if (e.key === "ArrowRight") {
      handleNextImage();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [currentImageIndex]); // Add currentImageIndex to dependencies

  const handleEdit = async (updatedData) => {
    try {
      const postRef = doc(db, "posts", id);
      await updateDoc(postRef, updatedData);
      // Update local state with new data
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        const postRef = doc(db, "posts", id);
        await deleteDoc(postRef);
        // Handle post deletion (e.g., redirect or remove from list)
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  // Add CSS to ensure the map container has dimensions
  const mapStyles = {
    display: isMapVisible ? "block" : "none",
    height: "400px",
    width: "100%",
    border: "1px solid #ccc",
    borderRadius: "8px",
    overflow: "hidden",
    marginTop: "1rem",
  };

  const handleMapToggle = () => {
    setIsMapVisible((prev) => !prev);
    if (!isMapVisible) {
      setIsMapLoaded(false); // Reset loaded state when showing map
    }
  };

  return (
    <div className={`bike-post ${isVisible ? "fade-in-up" : ""}`}>
      <div className="post-header">
        <div className="post-meta">
          <span className="post-date">{post.date}</span>
        </div>
        <h2 className="post-title">{post.title}</h2>
      </div>

      {post.description && (
        <div className="post-description">
          <p>{post.description}</p>
        </div>
      )}

      {imageArray && imageArray.length > 0 && (
        <div className="post-image-container">
          <div className="post-image">
            <img
              src={imageArray[currentImageIndex]}
              alt={`${title} - ${currentImageIndex + 1}`}
              loading="lazy"
              className="main-image"
            />
            {imageArray.length > 1 && (
              <>
                <button
                  className="nav-button prev"
                  onClick={handlePrevImage}
                  aria-label="Previous image"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button
                  className="nav-button next"
                  onClick={handleNextImage}
                  aria-label="Next image"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
                <div className="image-counter">
                  {currentImageIndex + 1} / {imageArray.length}
                </div>
              </>
            )}
          </div>
          <PhotoUploader onUploadComplete={handleUploadComplete} />
        </div>
      )}

      <div className="route-stats">
        <div className="stat-item">
          <i className="fas fa-route"></i>
          <span>{postStats.distance.toFixed(2)} km</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-clock"></i>
          <span>{postStats.duration}</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-tachometer-alt"></i>
          <span>{postStats.avgSpeed.toFixed(2)} km/h</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-mountain"></i>
          <span>{postStats.elevation.toFixed(0)}m</span>
        </div>
      </div>

      <div className="post-actions">
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button onClick={handleDelete}>Delete</button>
      </div>

      {/* Edit form modal */}
      {isEditing && (
        <EditPostForm
          post={{
            title: post.title,
            description: post.description,
            date: post.date,
            images: post.images,
            stats: post.stats,
            trackData: post.trackData,
            createdAt: post.createdAt,
          }}
          onSave={handleEditSave}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {/* Map section */}
      {trackData && (
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

BikePost.propTypes = {
  id: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  images: PropTypes.arrayOf(PropTypes.string),
  stats: PropTypes.shape({
    distance: PropTypes.number.isRequired,
    duration: PropTypes.string.isRequired,
    avgSpeed: PropTypes.number.isRequired,
    elevation: PropTypes.number.isRequired,
  }),
  trackData: PropTypes.object,
  description: PropTypes.string,
};

BikePost.defaultProps = {
  images: [],
  stats: defaultStats,
};

export default BikePost;

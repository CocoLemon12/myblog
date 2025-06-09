import React, { useState, useEffect, useRef } from "react";
import "../styles/About.css";
const DistanceIcon = () => (
  <svg
    className="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const TimeIcon = () => (
  <svg
    className="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ElevationIcon = () => (
  <svg
    className="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
  </svg>
);

const RidesIcon = () => (
  <svg
    className="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="18.5" cy="17.5" r="3.5" />
    <circle cx="5.5" cy="17.5" r="3.5" />
    <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2" />
  </svg>
);

const StatCard = ({ icon, label, value, unit, position }) => (
  <div className={`stat-block ${position}`}>
    <div className="stat-card">
      <div className="icon-wrapper">{icon}</div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value-wrapper">
          <span className="stat-value">{value}</span>
          {unit && <span className="stat-unit">{unit}</span>}
        </div>
      </div>
    </div>
  </div>
);

function About() {
  const [animatedStats, setAnimatedStats] = useState({
    distance: 0,
    duration: "0h 0m",
    elevation: 0,
    rides: 0,
    speed: 0,
  });

  const finalStats = {
    distance: 3916.65,
    duration: "209h 25m",
    elevation: 20437.29,
    rides: 110,
    speed: 20.0,
  };

  const statsRef = useRef(null);

  // Places Visited Data
  const places = [
    {
      id: 1,
      name: "Tagaytay, Cavite",
      description:
        "A scenic and challenging ride with a rewarding view of Taal Volcano.",
      image: "/images/tagaytay.jpg",
    },
    {
      id: 2,
      name: "Sierra Madre, Rizal",
      description:
        "Known for its long climbs and beautiful mountain scenery, a favorite training ground.",
      image: "/images/sierra-madre.jpg",
    },
    {
      id: 3,
      name: "Baguio City",
      description:
        'The ultimate climbing challenge, reaching the "Summer Capital of the Philippines" on two wheels.',
      image: "/images/baguio.jpg",
    },
    {
      id: 4,
      name: "Subic Bay, Zambales",
      description:
        "Smooth roads and a mix of flats and hills make this a great spot for all-around training.",
      image: "/images/subic.jpg",
    },
    {
      id: 5,
      name: "Kaybiang Tunnel, Cavite",
      description:
        "A popular cycling destination featuring the longest road tunnel in the Philippines.",
      image: "/images/kaybiang.jpg",
    },
    {
      id: 6,
      name: "Antipolo, Rizal",
      description:
        "A quick escape from the city with accessible climbs and great food stops.",
      image: "/images/antipolo.jpg",
    },
  ];

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(places.length / itemsPerPage);

  const paginatedPlaces = places.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animateNumbers();
          observer.disconnect(); // Animate only once
        }
      },
      { threshold: 0.1 } // Reduced threshold to trigger earlier
    );

    const currentStatsRef = statsRef.current;
    if (currentStatsRef) {
      observer.observe(currentStatsRef);
    }

    return () => {
      if (currentStatsRef) {
        observer.unobserve(currentStatsRef);
      }
    };
  }, []);

  const animateNumbers = () => {
    const animationDuration = 2000;
    const steps = 60;
    const interval = animationDuration / steps;
    let currentStep = 0;

    const [hours, minutes] = finalStats.duration
      .replace("h", "")
      .replace("m", "")
      .split(" ")
      .map((num) => parseInt(num, 10));

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      const currentHours = Math.floor(hours * easeOutCubic);
      const currentMinutes = Math.floor(minutes * easeOutCubic);

      setAnimatedStats({
        distance: Number((finalStats.distance * easeOutCubic).toFixed(1)),
        duration: `${currentHours}h ${currentMinutes}m`,
        elevation: Number((finalStats.elevation * easeOutCubic).toFixed(0)),
        rides: Math.round(finalStats.rides * easeOutCubic),
        speed: Number((finalStats.speed * easeOutCubic).toFixed(1)),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats({
          distance: finalStats.distance,
          duration: finalStats.duration,
          elevation: finalStats.elevation,
          rides: finalStats.rides,
          speed: finalStats.speed,
        });
      }
    }, interval);
  };

  return (
    <div className="about-container">
      <div className="intro-section">
        <div className="intro-content">
          <h1 className="intro-title">About The Rider</h1>
          <p className="intro-text">
            Hello, I'm Frank, a cyclist from Valenzuela, Philippines. Cycling
            isn't just a sport to me - it's how I explore, challenge myself, and
            find freedom. Here, I track my cycling journey, including the
            distances I've covered and the mountains I've climbed.
          </p>
        </div>
        <div className="intro-image">
          <img src="/images/profile.jpg" alt="Cyclist profile" />
        </div>
      </div>

      <div className="timeline-section">
        <h1 className="timeline-title">My Journey</h1>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-year">2022</div>
            <div className="timeline-content">
              <h3>Getting Started</h3>
              <p>
                I obtained my first steel frame mountain bike in 2022 and
                started tracking my rides on Strava. This was when I began
                exploring new routes and building my endurance.
              </p>
              <div className="timeline-image">
                <img src="/images/2022-bike.jpg" alt="My first mountain bike" />
              </div>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-year">2023</div>
            <div className="timeline-content">
              <h3>Finding My Purpose</h3>
              <p>
                Cycling became my way to stay healthy, both mentally and
                physically. Whether I was happy or stressed, riding my bike
                helped me turn those feelings into motivation to keep going.
              </p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-year">2024</div>
            <div className="timeline-content">
              <h3>Looking Forward</h3>
              <p>
                Even with a busy school life, I make time to ride. My current
                bike might be heavy, but it helps me build strength. I hope to
                one day get a better bike, ride across the Philippines, and
                maybe even join some local races after more training.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="places-section">
        <h1 className="places-title">Places I've Visited</h1>
        <div className="places-grid">
          {paginatedPlaces.map((place) => (
            <div key={place.id} className="place-card">
              <div className="place-card-image">
                <img src={place.image} alt={place.name} />
              </div>
              <div className="place-card-content">
                <h3>{place.name}</h3>
                <p>{place.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            Prev
          </button>
          <div className="pagination-dots">
            {[...Array(totalPages)].map((_, i) => (
              <div
                key={i}
                className={`pagination-dot ${
                  i === currentPage ? "active" : ""
                }`}
                onClick={() => setCurrentPage(i)}
              ></div>
            ))}
          </div>
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
      </div>

      <div ref={statsRef} className="stats-wrapper">
        <h1 className="stats-title">Rider Statistics</h1>

        <div className="stats-layout">
          <div className="center-content">
            <img
              src="/images/cyclist.png"
              alt="Cyclist riding a bike"
              className="cyclist-image"
            />
            <div className="speed-card">
              <div className="stat-value-wrapper">
                <span className="stat-value">
                  {animatedStats.speed.toFixed(1)}
                </span>
                <span className="stat-unit">km/h</span>
              </div>
              <div className="stat-label">AVERAGE SPEED</div>
            </div>
          </div>

          <StatCard
            icon={<DistanceIcon />}
            label="TOTAL DISTANCE"
            value={animatedStats.distance.toFixed(1)}
            unit="km"
            position="top-left"
          />
          <StatCard
            icon={<TimeIcon />}
            label="TOTAL TIME"
            value={animatedStats.duration}
            position="top-right"
          />
          <StatCard
            icon={<ElevationIcon />}
            label="TOTAL ELEVATION"
            value={String(animatedStats.elevation)}
            unit="m"
            position="bottom-left"
          />
          <StatCard
            icon={<RidesIcon />}
            label="TOTAL RIDES"
            value={String(animatedStats.rides)}
            position="bottom-right"
          />
        </div>
      </div>
    </div>
  );
}

export default About;

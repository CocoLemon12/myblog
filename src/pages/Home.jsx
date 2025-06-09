import React, { useState, useEffect } from "react";
import "../styles/Home.css";

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const stories = [
    {
      title: "Hi, there!",
      content:
        "I believe that every journey begins with a single pedal stroke.",
      image: "/images/scenic-road.jpg",
    },
    {
      title: "The Adventure",
      content:
        "Through winding roads and challenging climbs, we discover ourselves.",
      image: "/images/mountain-climb.jpg",
    },
    {
      title: "The Community",
      content:
        "Cycling brings people together, creating lasting friendships on two wheels.",
      image: "/images/group-ride.jpg",
    },
    {
      title: "The Journey",
      content: "Every ride is a new story waiting to be told.",
      image: "/images/sunset-ride.jpg",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % stories.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [stories.length]);

  const handleSlideChange = (index) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 1200);
  };

  return (
    <div className="home-container">
      <div className="container">
        <div className="story-container">
          <div className="story-content">
            <div className="text-content">
              <h1 key={`title-${currentSlide}`}>{stories[currentSlide].title}</h1>
              <p key={`content-${currentSlide}`}>
                {stories[currentSlide].content}
              </p>
              <div className="progress-dots">
                {stories.map((_, index) => (
                  <span
                    key={index}
                    className={`dot ${index === currentSlide ? "active" : ""}`}
                    onClick={() => handleSlideChange(index)}
                  />
                ))}
              </div>
            </div>
            <div
              className="story-image"
              key={`image-${currentSlide}`}
              style={{
                backgroundImage: `url(${stories[currentSlide].image})`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;

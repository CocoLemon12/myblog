import React, { useState } from "react";

const triviaData = [
  {
    title: "Did You Know?",
    fact: "The first bicycle was created in 1817 and had no pedals - riders pushed it along with their feet!",
  },
  {
    title: "Fitness Fact",
    fact: "Cycling for just 30 minutes burns around 200 calories on average.",
  },
  {
    title: "Tour Trivia",
    fact: "The Tour de France started in 1903 and cyclists rode at night during early races.",
  },
  {
    title: "Local Insight",
    fact: "The Philippines has over 5 million bicycle users as of 2023.",
  },
  {
    title: "Science of Cycling",
    fact: "A person on a bicycle can travel up to 3.5 times faster than walking while using the same amount of energy.",
  },
  {
    title: "Cyclist Lingo",
    fact: "The term 'bonking' in cycling means running out of energy due to depleted glycogen stores.",
  },
  {
    title: "Historical Ride",
    fact: "The first woman to cycle around the world was Annie Londonderry, completing her journey in 1895.",
  },
  {
    title: "Gear Talk",
    fact: "A standard bicycle chain has 106 links.",
  },
  {
    title: "World Record",
    fact: "The fastest speed ever recorded on a bicycle is 183.9 mph (296 km/h), set by Denise Mueller-Korenek.",
  },
  {
    title: "Health Benefit",
    fact: "Regular cycling can reduce the risk of heart disease by 50%.",
  },
  {
    title: "Inventive Design",
    fact: "Leonardo da Vinci sketched designs for a geared bicycle in the 15th century.",
  },
  {
    title: "City Cycling",
    fact: "Copenhagen, Denmark, is known as one of the most bicycle-friendly cities in the world, with over 62% of commuters using bikes.",
  },
  {
    title: "Olympic Sport",
    fact: "Cycling has been part of every modern Olympic Games since 1896.",
  },
  {
    title: "Safety First",
    fact: "Wearing a helmet while cycling can reduce the risk of head injury by 85%.",
  },
  {
    title: "Bike Anatomy",
    fact: "The average bicycle has around 30 parts.",
  },
  {
    title: "Material Science",
    fact: "Early bicycle frames were made of wood, while modern bikes often use carbon fiber or aluminum.",
  },
  {
    title: "Longest Race",
    fact: "The longest cycling race is the Race Across America (RAAM), covering over 3,000 miles.",
  },
  {
    title: "Eco-Friendly",
    fact: "Using a bicycle instead of a car for a 10-mile commute saves approximately 4.5 pounds of CO2 emissions.",
  },
  {
    title: "Tire Tech",
    fact: "Pneumatic (air-filled) tires for bicycles were invented in 1888 by John Boyd Dunlop.",
  },
  {
    title: "Trick Cycling",
    fact: "Freestyle BMX riders perform acrobatic maneuvers and stunts on specially designed bikes.",
  },
  {
    title: "Global Production",
    fact: "China is the world's largest producer of bicycles.",
  },
  {
    title: "Kids on Bikes",
    fact: "The average child learns to ride a bike between the ages of 3 and 8.",
  },
  {
    title: "Mountain Biking",
    fact: "Mountain biking originated in California in the 1970s.",
  },
  {
    title: "Bike Sharing",
    fact: "The world's largest bike-sharing program is in Hangzhou, China, with over 80,000 bikes.",
  },
  {
    title: "Art of Cycling",
    fact: "Marcel Duchamp's 'Bicycle Wheel' (1913) is considered one of the first 'readymade' artworks.",
  },
  {
    title: "Aerodynamics",
    fact: "Professional cyclists wear aerodynamic helmets and clothing to reduce drag and improve speed.",
  },
  {
    title: "Oldest Bicycle Company",
    fact: "The British bicycle manufacturer Raleigh Bicycles was founded in 1887.",
  },
  {
    title: "Cycling Benefits",
    fact: "Cycling can improve joint mobility and coordination without putting excessive strain on joints.",
  },
  {
    title: "Track Cycling",
    fact: "Velodromes, specialized tracks with banked turns, are used for competitive track cycling.",
  },
  {
    title: "Recumbent Bikes",
    fact: "Recumbent bicycles allow riders to recline, providing a more comfortable and aerodynamic position.",
  },
  {
    title: "Winter Cycling",
    fact: "In some Nordic countries, cycling is a popular mode of transport even in snowy conditions, with studded tires used for grip.",
  },
  {
    title: "Human Power",
    fact: "The human body is more efficient at converting food energy into forward motion on a bicycle than any other mode of transport.",
  },
  {
    title: "Bike Lanes",
    fact: "The first designated bicycle lane in the United States was established in New York City in 1894.",
  },
  {
    title: "Paramount Power",
    fact: "A fit cyclist can generate around 400 watts of power for sustained periods, while a top sprinter can exceed 1,500 watts.",
  },
  {
    title: "Chainless Bikes",
    fact: "Some modern bikes use shaft drives or belt drives instead of traditional chains.",
  },
  {
    title: "Penny-Farthing",
    fact: "The Penny-Farthing bicycle, popular in the late 19th century, had a very large front wheel and a small rear wheel.",
  },
  {
    title: "Folding Bikes",
    fact: "Folding bicycles are designed to be compact for easy storage and transportation, particularly popular in urban areas.",
  },
  {
    title: "Tour de France Winners",
    fact: "Only four cyclists have won the Tour de France five times: Jacques Anquetil, Eddy Merckx, Bernard Hinault, and Miguel Indurain.",
  },
  {
    title: "Adaptive Cycling",
    fact: "Handcycles and tricycles are examples of adaptive bikes that allow people with disabilities to enjoy cycling.",
  },
  {
    title: "Bike Maintenance",
    fact: "Regular cleaning and lubrication of your bike chain can significantly extend its lifespan and improve performance.",
  },
  {
    title: "Cadence Control",
    fact: "Cyclists often focus on maintaining a consistent 'cadence' (pedaling revolutions per minute) for efficiency.",
  },
  {
    title: "Electric Bikes",
    fact: "E-bikes, or electric bicycles, use a motor to assist pedaling, making cycling more accessible for various terrains and fitness levels.",
  },
  {
    title: "Pumptracks",
    fact: "Pumptracks are circuits of rollers and berms designed for cyclists to ride without pedaling, using their body weight to generate momentum.",
  },
  {
    title: "Commuter Choice",
    fact: "Globally, cycling prevents approximately 200,000 tons of greenhouse gas emissions annually by replacing car trips.",
  },
];

const LoadingTrivia = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % triviaData.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? triviaData.length - 1 : prev - 1));
  };

  return (
    <div className="rides-container loading">
      <div className="loading-trivia-card">
        <h2 className="loading-title">Loading Rides</h2>
        <div className="loading-spinner" />
        <p className="loading-message">Fetching data from database...</p>

        <div className="trivia-section">
          <h3 className="trivia-title">{triviaData[currentIndex].title}</h3>
          <p className="trivia-content">{triviaData[currentIndex].fact}</p>

          <div className="trivia-controls">
            <button onClick={handlePrev} className="trivia-button">
              Previous
            </button>
            <span className="trivia-counter">
              {currentIndex + 1} / {triviaData.length}
            </span>
            <button onClick={handleNext} className="trivia-button">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingTrivia;

import React from "react";
import { Link } from "react-router-dom";
import "../styles/Header.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faInstagram,
  faStrava,
} from "@fortawesome/free-brands-svg-icons";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";

function Header({ toggleTheme, theme, activeSection }) {
  return (
    <header className="header">
      <nav className="nav-container">
        <div className="nav-left">
          <ul className="nav-links">
            <li>
              <Link to="/" className={activeSection === "/" ? "active" : ""}>
                HOME
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className={activeSection === "/about" ? "active" : ""}
              >
                ABOUT
              </Link>
            </li>
            <li>
              <Link to="/rides">RIDES</Link>
            </li>
          </ul>
        </div>
        <div className="nav-center">
          <Link to="/" className="logo">
            XAFRNK
          </Link>
        </div>
        <div className="nav-right">
          <div className="social-links">
            <button onClick={toggleTheme} className="theme-toggle">
              <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} />
            </button>
            <a
              href="https://facebook.com/frank.angelo792"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faFacebook} />
            </a>
            <a
              href="https://www.instagram.com/xafrnk_/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faInstagram} />
            </a>
            <a
              href="https://strava.app.link/VtOudVr19Rb"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faStrava} />
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;

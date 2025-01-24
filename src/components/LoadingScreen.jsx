import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setIntroShown } from "../store/loadingSlice";
import "./LoadingScreen.css";

function LoadingScreen({ onComplete }) {
  const dispatch = useDispatch();
  const [ascii, setAscii] = useState("");

  // ASCII art characters to randomly generate background
  const chars = "░▒▓█▀▄▌▐│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌";

  const generateAscii = useCallback(() => {
    const width = Math.floor(window.innerWidth / 12); // Approximate character width
    const height = Math.floor(window.innerHeight / 20); // Approximate character height
    let art = "";

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        art += chars[Math.floor(Math.random() * chars.length)];
      }
      art += "\n";
    }
    return art;
  }, []);

  useEffect(() => {
    let interval;
    let timeout;

    // Update ASCII art every 100ms
    interval = setInterval(() => {
      setAscii(generateAscii());
    }, 100);

    // Complete after 2 seconds
    timeout = setTimeout(() => {
      clearInterval(interval);
      dispatch(setIntroShown());
      onComplete();
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [dispatch, generateAscii, onComplete]);

  return (
    <div className="loading-screen">
      <pre className="ascii-art">{ascii}</pre>
      <div className="loading-text">LOADING INVENTORY</div>
    </div>
  );
}

export default LoadingScreen;

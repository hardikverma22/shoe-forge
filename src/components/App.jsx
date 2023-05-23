import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSnapshot } from "valtio";
import { state } from "../store";
import Home from "./Home";
import LoadingScreen from "./LoadingScreen";
import { useProgress } from "@react-three/drei";

const App = () => {
  const [loaded, setloaded] = useState(false);

  const { progress } = useProgress();

  useEffect(() => {
    if (progress) setloaded(true);
  }, [progress]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    state.isMobile = mediaQuery.matches;

    const handleMediaQueryChange = (event) => {
      state.isMobile = mediaQuery.matches;
    };

    mediaQuery.addEventListener("change", handleMediaQueryChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaQueryChange);
    };
  }, []);

  return (
    <>
      <div style={{ display: loaded ? "block" : "none" }}>
        <Home />
      </div>
      <div style={{ display: loaded ? "none" : "block" }}>
        <LoadingScreen />
      </div>
    </>
  );
};

export default App;

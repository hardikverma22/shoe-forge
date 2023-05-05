import Canvas from "./Canvas";
import Overlay from "./Overlay";
import TitleText from "./TitleText";
import Decals from "./Decals";
import { useEffect, useState } from "react";
import LoadingScreen from "./LoadingScreen";
import { motion, AnimatePresence } from "framer-motion";
import { state } from "../store";
import { useSnapshot } from "valtio";

const App = () => {
  const [loaded, setloaded] = useState(false);

  const snapshot = useSnapshot(state);
  console.log(snapshot.isMobile);
  useEffect(() => {
    let timer = setTimeout(() => setloaded(true), 3000);
    () => clearTimeout(timer);
  }, []);

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
    <AnimatePresence mode="wait">
      {loaded ? (
        <div className="w-full h-full overflow-x-hidden relative">
          <div className="h-full" id="canvasRoot">
            <Canvas />
          </div>
          <div className="absolute top-0 right-0 h-full">
            <Overlay />
          </div>
          <TitleText />
          <Decals />
        </div>
      ) : (
        <motion.div
          key="loader"
          initial={{ x: 0 }}
          exit={{ x: "-100%", transition: { duration: 0.5 } }}
          className="w-full h-full overflow-x-hidden relative"
        >
          <LoadingScreen />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default App;

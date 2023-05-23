import { useEffect, useRef } from "react";
import { useSnapshot } from "valtio";
import { state } from "../store";
import Decals from "./Decals";
import Features from "./Features";
import Hero from "./Hero";
import MainCanvas from "./MainCanvas";
import Overlay from "./Overlay";
import TitleText from "./TitleText";

const Home = () => {
  const snap = useSnapshot(state);

  const featureRef = useRef();

  return (
    <div className="relative w-full">
      <div
        className={`lg:flex ${snap.intro ? "hidden" : ""}  h-screen w-full ${
          snap.intro ? "fixed top-0 z-0" : ""
        }`}
      >
        <MainCanvas />
      </div>

      {!snap.intro ? (
        <>
          <div className="absolute top-0 right-0 h-full">
            <Overlay />
          </div>
          <TitleText />
          <Decals />
        </>
      ) : (
        <>
          <div className="z-50 relative">
            <Hero ref={featureRef} />
            <Features featureRef={featureRef} />
          </div>
        </>
      )}
    </div>
  );
};

export default Home;

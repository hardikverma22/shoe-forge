import { forwardRef } from "react";
import { motion } from "framer-motion";
import { fadeInY, textContainer, letterVariant, container } from "../motion";

const Hero = forwardRef(({}, ref) => {
  const scrollToEnd = () => {
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="h-screen w-full">
      <div className="p-28">
        <motion.div
          variants={textContainer()}
          initial="hidden"
          animate="show"
          className="text-9xl flex overflow-hidden pb-3 font-extrabold text-white drop-shadow-[0_3.2px_3.2px_rgba(0,0,0,0.8)]"
        >
          {"Shoe Forge".split("").map((letter, index) => (
            <motion.span key={`${letter}-${index}`} variants={letterVariant()}>
              {letter}
            </motion.span>
          ))}
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show">
          <motion.h2
            variants={fadeInY()}
            className="text-4xl font-extrabold
                      text-transparent bg-gradient-to-r from-yellow-500  to-yellow-900 bg-clip-text 
                      mt-8 tracking-wide"
          >
            3D Shoe Customizer & Visualizer
          </motion.h2>
          <motion.p
            variants={fadeInY()}
            className="text-lg font-semibold text-gray-800 max-w-2xl pt-5 tracking-wider font-Libre"
          >
            Welcome to our cutting-edge 3D shoe customizer, where you can
            unleash your creativity and design the perfect pair of shoes to suit
            your unique style.
          </motion.p>
          <motion.div variants={fadeInY()} className="pt-5">
            <button
              className="bg-yellow-300 text-gray-600 font-bold rounded-md
                      px-4 py-2
                      shadow-2xl
                      hover:scale-105 transition-transform duration-300"
              onClick={scrollToEnd}
            >
              Explore Features
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
});

export default Hero;

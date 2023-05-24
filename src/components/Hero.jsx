import { forwardRef } from "react";
import { motion } from "framer-motion";
import { fadeInY, textContainer, letterVariant, container } from "../motion";

const Hero = forwardRef(({}, ref) => {
  const scrollToEnd = () => {
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="h-screen w-full">
      <div
        className="lg:p-28 px-10 py-20 
                      flex flex-col justify-center items-center lg:justify-start lg:items-start"
      >
        <motion.div
          variants={textContainer()}
          initial="hidden"
          animate="show"
          className="lg:text-9xl md:text-7xl text-5xl flex  overflow-hidden pb-3
                    font-extrabold text-white
                    drop-shadow-[0_3.2px_3.2px_rgba(0,0,0,0.8)]"
        >
          {"Shoe Forge".split("").map((letter, index) => (
            <motion.span key={`${letter}-${index}`} variants={letterVariant()}>
              {letter == " " ? <span>&nbsp;</span> : letter}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          variants={container()}
          initial="hidden"
          animate="show"
          className="flex flex-col justify-center items-center
                     lg:justify-start lg:items-start
                    text-center lg:text-left"
        >
          <motion.h2
            variants={fadeInY()}
            className="lg:text-4xl md:text-3xl text-2xl lg:text-left font-extrabold
                      text-transparent bg-gradient-to-r from-yellow-500  to-yellow-900 bg-clip-text 
                      mt-8 tracking-wide"
          >
            3D Shoe Customizer <br className="lg:hidden flex" /> & Visualizer
          </motion.h2>
          <motion.p
            variants={fadeInY()}
            className="lg:text-lg text-md font-semibold text-gray-800 max-w-2xl pt-5 tracking-wider font-Libre"
          >
            Welcome to our cutting-edge 3D shoe customizer, where you can
            unleash your creativity and design the perfect pair of shoes to suit
            your unique style.
          </motion.p>
          <motion.div variants={fadeInY()} className="md:pt-10 pt-5 z-50">
            <button
              className="bg-yellow-300 text-gray-600 font-bold rounded-md
                      px-4 py-2
                      shadow-2xl z-50
                      hover:scale-105 transition-transform duration-300"
              onClick={scrollToEnd}
            >
              Explore Features
            </button>
          </motion.div>
          <motion.div variants={fadeInY()} className="lg:hidden flex pt-10 z-0">
            <motion.img
              initial={{ y: 0 }}
              animate={{ y: [-15, 0, 15] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
                repeatType: "reverse",
              }}
              src="static_shoe.png"
              className="hidden md:block"
            />

            <motion.img
              initial={{ y: 0, scale: 2 }}
              animate={{ y: [-15, 0, 15] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
                repeatType: "reverse",
              }}
              src="static_shoe.png"
              className="md:hidden block"
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
});

export default Hero;

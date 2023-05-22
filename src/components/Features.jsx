import { useSnapshot } from "valtio";
import { state } from "../store";
import { FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";
import { fadeInX, fadeInY, textContainer } from "../motion";
const Features = ({ featureRef }) => {
  const snap = useSnapshot(state);

  return (
    <div
      className="h-screen
                    w-full second-section
                    flex flex-col items-center
                    p-10 font-Libre"
      ref={featureRef}
    >
      <div className="w-full flex justify-end p-10">
        <motion.div
          variants={textContainer()}
          initial="hidden"
          whileInView="show"
          className="flex flex-col w-[60%]"
        >
          <motion.h3
            variants={fadeInY()}
            className="text-3xl text-yellow-500 font-extrabold font-serif tracking-wide"
          >
            Features
          </motion.h3>
          <motion.p
            variants={fadeInY()}
            className="text-md text-gray-600 font-sans tracking-wider mt-2 font-semibold"
          >
            An intuitive and engaging 3D shoe configurator, allowing users to
            customize their footwear by choosing from a wide range of materials,
            colors, geometries, and decals.
          </motion.p>
          <motion.div className="flex gap-5 pt-5">
            <motion.div
              variants={fadeInX(-50, 0.5)}
              className="flex flex-col justify-center items-center
                           gap-5 bg-slate-500/30 p-5 rounded-lg font-serif tracking-wide"
            >
              <motion.h4
                variants={fadeInY(0.3, 50)}
                className="text-md leading-7 text-white"
              >
                Decals
              </motion.h4>
              <motion.div
                variants={textContainer(0.2, 0)}
                className="flex flex-col gap-5"
              >
                {snap.decals.map((decal) => (
                  <motion.div
                    whileHover={{
                      scale: 1.1,
                      rotate: 360,
                      transition: {
                        duration: 0.4,
                        ease: "easeInOut",
                        bounce: 0.3,
                        type: "spring",
                      },
                    }}
                    variants={fadeInY(0.3, 50)}
                    key={decal}
                    className="rounded-full p-2 bg-white/60 aspect-square
                                  flex justify-center items-center"
                  >
                    <img src={`${decal}.png`} className="w-14 object-contain" />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            <motion.div
              variants={fadeInX(50)}
              className="flex flex-1 flex-col gap-5 justify-center items-center
                           bg-slate-500/30 p-5 rounded-lg font-serif tracking-wide"
            >
              <motion.h4
                variants={fadeInY(0.7, 20)}
                className="text-md leading-7 text-white"
              >
                Textures
              </motion.h4>
              <motion.div
                variants={textContainer(0.2, 0.5)}
                className="grid grid-cols-2 gap-5 gap-x-16"
              >
                {snap.textures.map((texture, index) => (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    variants={fadeInX(index % 2 == 0 ? -50 : 50, 0.4)}
                    key={texture}
                    className="h-10 w-40 border-2 border-white rounded-md bg-no-repeat"
                    style={{
                      backgroundImage: `url("./${texture}-thumb.png")`,
                      backgroundSize: "150% 150%",
                      backgroundPosition: "center",
                    }}
                  ></motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
          <motion.div variants={fadeInY(0.3, 50)} className="flex gap-5 pt-5">
            <div
              className="flex flex-1 gap-10 justify-start items-center
                       bg-slate-500/30 p-3 rounded-lg font-serif tracking-wide
                      mt-5 px-5 shadow-lg"
            >
              <motion.h4
                variants={fadeInX(-50, 0.3)}
                className="text-md text-white"
              >
                Colors
              </motion.h4>
              <motion.div
                variants={textContainer(0.3, 0)}
                className="flex gap-10"
              >
                {snap.colors.map((color) => (
                  <motion.div
                    variants={fadeInX(50, 0.3)}
                    whileHover={{ scale: 1.1 }}
                    key={color}
                    className="h-10 w-10 border-2 border-white rounded-full bg-no-repeat"
                    style={{
                      backgroundColor: color,
                    }}
                  ></motion.div>
                ))}
              </motion.div>
            </div>
            <div
              className="flex gap-5 justify-start items-center
                         rounded-lg font-serif tracking-wide
                      mt-5"
            >
              <button
                className="p-3 bg-yellow-300
                                 rounded-lg h-full
                                flex gap-2 justify-center items-center
                                text-black font-bold
                                hover:scale-105 transition-all duration-300 hover:gap-5 hover:text-lg"
                onClick={() => (state.intro = false)}
              >
                <span>Customize</span>
                <FaArrowRight className="text-2xl" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Features;

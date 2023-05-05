import { motion } from "framer-motion";
import { state } from "../store";
import { useSnapshot } from "valtio";

const TitleText = () => {
  const snap = useSnapshot(state);
  return (
    <motion.div
      initial={{ backgroundPosition: "0 0" }}
      animate={{
        backgroundPosition: [
          "0 0",
          "2px 2px",
          "4px 4px",
          "6px 6px",
          "8px 8px",
          "6px 6px",
          "4px 4px",
          "2px 2px",
          "0 0",
        ],
      }}
      transition={{
        duration: 2,

        ease: "linear",
      }}
      className="absolute top-5 left-5
                  md:text-7xl text-3xl font-extrabold
                  bg-clip-text text-transparent bg-contain py-2"
      style={{ backgroundImage: `url("${snap.mesh.texture}.jpg")` }}
    >
      <span className="w-full h-full">Shoe Forge</span>
    </motion.div>
  );
};

export default TitleText;

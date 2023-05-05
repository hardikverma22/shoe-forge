import { Html, useProgress } from "@react-three/drei";
import { motion } from "framer-motion";

const CanvasLoader = () => {
  const { progress } = useProgress();

  return (
    <Html
      as="div"
      center
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <div className="flex flex-col gap-2 justify-center items-center w-full h-screen">
        <p className="text-black text-lg font-bold">{progress.toFixed(2)}%</p>
        <motion.div className="flex items-center">
          <motion.div
            className="w-4 h-4 rounded-full mr-2 bg-primary"
            animate={{ y: 10 }}
            initial={{ y: 0 }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0,
            }}
          />
          <motion.div
            className="w-4 h-4 rounded-full mr-2 bg-secondary"
            animate={{ y: 10 }}
            initial={{ y: 0 }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0.2,
            }}
          />
          <motion.div
            className="w-4 h-4 rounded-full bg-tertiary"
            animate={{ y: 10 }}
            initial={{ y: 0 }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0.4,
            }}
          />
        </motion.div>
      </div>
    </Html>
  );
};

export default CanvasLoader;

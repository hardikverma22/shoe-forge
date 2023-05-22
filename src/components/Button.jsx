import { motion } from "framer-motion";
import { palet } from "../motion";

const Button = ({ meshColor, onClick, title, Icon }) => {
  return (
    <motion.button
      variants={palet}
      transition={{
        duration: 0.5,

        ease: [0.5, 1, 0.5, 1],
      }}
      style={{
        backgroundColor: meshColor === "#FFFFFF" ? "#EFBD4E" : meshColor,
      }}
      className={`text-white md:text-lg text-sm tracking-wide font-medium
                      p-2 w-[166px]
                      hover:shadow-[inset_-250px_0_0_0_black]
                      hover:scale-105
                      duration-500
                      flex gap-2 justify-center items-center`}
      onClick={onClick}
    >
      <Icon className="text-lg font-bold" />
      <span>{title}</span>
    </motion.button>
  );
};

export default Button;

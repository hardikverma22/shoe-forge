import { useSnapshot } from "valtio";
import { state } from "../store";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const palet = {
  hidden: { x: -30 },
  show: {
    x: 0,
  },
  exit: {
    x: -30,
  },
};

const Palet = ({ title, stateColor }) => {
  const snapshot = useSnapshot(state);
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const handleClick = (e) => {
    e.stopPropagation();
    setOpen(!open);
  };

  const handlePickColor = (e, color) => {
    e.stopPropagation();
    setOpen(false);
    state[stateColor].color = color;
  };

  const handlePickTexture = (e, texture) => {
    e.stopPropagation();
    setOpen(false);
    state[stateColor].texture = texture;
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClickOutside = (event) => {
    if (ref.current && !ref.current.contains(event.target)) {
      setOpen(false);
    }
  };

  return (
    <div className="cursor-pointer">
      {!open && (
        <motion.div
          variants={palet}
          transition={{
            duration: 0.5,
            type: "tween",
            ease: "easeInOut",
          }}
          className={`flex gap-4 items-center
                 bg-stone-50 p-2 rounded-lg ${
                   !snapshot.isMobile
                     ? "w-[156px] justify-start"
                     : "w-[96px] justify-center"
                 } shadow-md`} // h-[72px]"
          onClick={handleClick}
        >
          {snapshot[stateColor].color && !snapshot.isMobile && (
            <div
              className="w-6 h-6 rounded-full border-2 border-gray-300"
              style={{ background: snapshot[stateColor].color }}
            />
          )}

          {snapshot[stateColor].texture && !snapshot.isMobile && (
            <div
              className="w-6 h-6 rounded-full bg-contain bg-no-repeat bg-origin-content"
              style={{
                backgroundImage: `url("./shoe/${snapshot[stateColor].texture}-thumb.png")`,
              }}
            />
          )}

          <span>{title}</span>
        </motion.div>
      )}
      {open && (
        <motion.div
          initial={{ x: 30 }}
          animate={{ x: 0 }}
          transition={{
            duration: 1,
            type: "spring",
            ease: "easeInOut",
            bounce: 0.5,
          }}
          ref={ref}
          className="flex gap-2 justify-center items-center
                        bg-stone-200 p-2 rounded-md h-full"
        >
          <div className="flex flex-col gap-2 h-full justify-center items-center">
            <div className="flex gap-2">
              {snapshot.textures.map((texture) => (
                <motion.div
                  key={texture}
                  whileHover={{ scale: 1.1, border: "1px solid black" }}
                  onClick={(e) => handlePickTexture(e, texture)}
                  className={`rounded-full bg-contain ${
                    texture === snapshot[stateColor].texture
                      ? "border-2 border-black shadow-lg w-7 h-7"
                      : "w-6 h-6"
                  }`}
                  style={{
                    backgroundImage: `url("./shoe/${texture}-thumb.png")`,
                  }}
                />
              ))}
              <span>Textures</span>
            </div>
            <div className="flex gap-2 justify-center items-center">
              {snapshot.colors.map((color) => (
                <motion.div
                  key={color}
                  whileHover={{ scale: 1.1, border: "1px solid black" }}
                  onClick={(e) => handlePickColor(e, color)}
                  className={`rounded-full   ${
                    color === snapshot[stateColor].color
                      ? "border-2 border-black shadow-lg w-7 h-7"
                      : "border-2 border-gray-500 w-6 h-6"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}

              <span>Colors</span>
            </div>
          </div>
          <div className="bg-white w-full h-full flex justify-center items-center p-1 rounded-md">
            <span style={{ writingMode: "tb" }}>{title}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Palet;

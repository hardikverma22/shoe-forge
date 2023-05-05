import { motion } from "framer-motion";
import { RxDownload, RxReset } from "react-icons/rx";
import { useSnapshot } from "valtio";
import { state } from "../store";
import Palet from "./Palet";
import { BsArrowLeftCircleFill, BsArrowRightCircleFill } from "react-icons/bs";
import { useState } from "react";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0,
      type: "tween",
      delay: 4,
    },
  },
};

const Overlay = () => {
  const snapshot = useSnapshot(state);

  const [IsDrawerClosed, SetIsDrawerClosed] = useState(true);

  const onDownloadClick = () => {
    const link = document.createElement("a");
    link.setAttribute("download", "canvas.png");
    link.setAttribute(
      "href",
      document
        .querySelector("canvas")
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream")
    );
    link.click();
  };

  return (
    <div className="h-full">
      <motion.div
        initial={false}
        animate={{ x: snapshot.isMobile && IsDrawerClosed ? 500 : 0 }}
        className="flex justify-center items-end flex-col gap-4 h-full pr-10 overflow-hidden"
      >
        <motion.button
          initial={{ x: 20, opacity: 1 }}
          animate={{ x: snapshot.isMobile ? 20 : [15, 10, 0], opacity: 1 }}
          transition={{
            duration: 0.5,

            ease: [0.5, 1, 0.5, 1],
          }}
          style={{
            backgroundColor:
              snapshot.mesh.color === "#FFFFFF"
                ? "#EFBD4E"
                : snapshot.mesh.color,
          }}
          className="text-white md:text-lg text-sm tracking-wide font-medium fixed top-10 right-10
                      p-2 w-[166px]
                      hover:shadow-[inset_-250px_0_0_0_black]
                      hover:scale-105
                      duration-500
                      flex gap-2 justify-center items-center"
          onClick={() => (state.rotation = [0.6, -2.5, -0.2])}
        >
          <RxReset className="text-lg font-bold" />
          <span>Reset Postion</span>
        </motion.button>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex justify-center items-end gap-5 flex-col"
        >
          <Palet title="Mesh" stateColor="mesh" />
          <Palet title="Laces" stateColor="laces" />
          <Palet title="Inner" stateColor="inner" />
          <Palet title="Sole" stateColor="sole" />
          <Palet title="Caps" stateColor="caps" />
          <Palet title="Stripes" stateColor="stripes" />
          <Palet title="Band" stateColor="band" />
          <Palet title="Patch" stateColor="patch" />
        </motion.div>
        <motion.button
          style={{
            backgroundColor:
              snapshot.mesh.color === "#FFFFFF"
                ? "#EFBD4E"
                : snapshot.mesh.color,
          }}
          className="text-white md:text-lg text-sm tracking-wide font-medium fixed bottom-10 right-5
                      p-2 w-[166px]
                      hover:shadow-[inset_-250px_0_0_0_black]
                      hover:scale-105
                      duration-500
                      flex gap-2 justify-center items-center"
          onClick={onDownloadClick}
        >
          <RxDownload className="text-lg font-bold" />
          <span>Download</span>
        </motion.button>
      </motion.div>
      <button
        style={{
          backgroundColor:
            snapshot.mesh.color === "#FFFFFF" ? "#EFBD4E" : snapshot.mesh.color,
        }}
        className={`absolute top-[50%] -right-1
                    p-2 h-24 rounded-lg shadow-lg bg-yellow-500 md:hidden flex justify-center items-center`}
        onClick={() => SetIsDrawerClosed(!IsDrawerClosed)}
      >
        {IsDrawerClosed ? (
          <BsArrowLeftCircleFill className="text-xl text-white" />
        ) : (
          <BsArrowRightCircleFill className="text-xl text-white" />
        )}
      </button>
    </div>
  );
};

export default Overlay;

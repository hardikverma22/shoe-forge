import { motion } from "framer-motion";
import { RxDownload, RxReset, RxShadow } from "react-icons/rx";
import { useSnapshot } from "valtio";
import { state } from "../store";
import Palet from "./Palet";
import { BsArrowLeftCircleFill, BsArrowRightCircleFill } from "react-icons/bs";
import { useState } from "react";
import Button from "./Button";
import { container } from "../motion";

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

  const onClick = () => {
    state.intro = true;
  };

  return (
    <div className="h-full">
      <motion.div
        initial={false}
        animate={{ x: snapshot.isMobile && IsDrawerClosed ? 500 : 0 }}
        className="flex justify-center items-end flex-col gap-4 h-full pr-10 overflow-hidden"
      >
        <motion.div
          variants={container(0)}
          initial="hidden"
          animate="show"
          className="flex justify-center items-end gap-5 flex-col"
        >
          <Button
            meshColor={snapshot.mesh.color}
            onClick={onClick}
            Icon={RxReset}
            title="Go Back"
          />
          <Palet title="Mesh" stateColor="mesh" />
          <Palet title="Laces" stateColor="laces" />
          <Palet title="Inner" stateColor="inner" />
          <Palet title="Sole" stateColor="sole" />
          <Palet title="Caps" stateColor="caps" />
          <Palet title="Stripes" stateColor="stripes" />
          <Palet title="Band" stateColor="band" />
          <Palet title="Patch" stateColor="patch" />
          <Button
            meshColor={snapshot.mesh.color}
            onClick={onDownloadClick}
            Icon={RxDownload}
            title="Download"
          />
        </motion.div>
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

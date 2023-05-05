import { useSnapshot } from "valtio";
import { state } from "../store";

const Decals = () => {
  const snap = useSnapshot(state);

  const handleDecalClick = (e, decal) => {
    e.stopPropagation();
    state.selectedDecal = decal;
  };

  return (
    <div className="absolute bottom-0 left-0 p-10">
      <div className="flex gap-5 justify-center items-center">
        {snap.decals.map((decal) => {
          return (
            <div
              key={decal}
              style={{
                "--tw-shadow-color":
                  snap.mesh.color === "#FFFFFF" ? "#EFBD4E" : snap.mesh.color,
              }}
              className="shadow-md md:w-20 md:h-20 h-12 w-12 flex justify-center items-center shadow-[#ffff] rounded-full hover:scale-110 duration-300"
            >
              <img
                src={`${decal}.png`}
                alt={decal}
                className="w-20 aspect-auto p-2"
                onClick={(e) => handleDecalClick(e, decal)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Decals;

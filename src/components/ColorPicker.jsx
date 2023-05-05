import { useState } from "react";
import { SketchPicker } from "react-color";
import { state } from "../store";

const ColorPicker = ({ color, ObjectColor }) => {
  const [isPickerOpen, SetIsPickerOpen] = useState(false);

  const handleOpenPalet = () => {
    SetIsPickerOpen(!isPickerOpen);
  };

  return (
    <div>
      <button
        onClick={handleOpenPalet}
        className="colo-picker-btn"
        style={{ backgroundColor: "red" }}
      >
        Pick Color
      </button>
      {isPickerOpen && (
        <div style={{ position: "absolute", zIndex: "20000" }}>
          <div
            onClick={() => SetIsPickerOpen(false)}
            style={{
              position: "fixed",
              top: "0px",
              right: "0px",
              bottom: "0px",
              left: "0px",
            }}
          >
            <SketchPicker
              color={color}
              onChange={(e) => {
                state[ObjectColor] = e.rgb;
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;

const LoadingScreen = () => {
  const boxVariants = {
    hover: { scale: 1.05, strokeWidth: 60 },
    pressed: { scale: 0.95, strokeWidth: 35 },
    checked: { stroke: "#FF008C" },
    unchecked: { stroke: "#ddd", strokeWidth: 50 },
  };

  return (
    <section className="bg-yellow-300 relative place-items-center grid h-screen w-screen gap-4">
      <div className="bg-white w-48 h-48  absolute animate-ping rounded-full delay-5s shadow-xl"></div>

      <div className="bg-white w-32 h-32 absolute animate-ping rounded-full shadow-xl"></div>

      <div className="w-20 h-20">
        <svg
          version="1.1"
          id="Capa_1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          x="0px"
          y="0px"
          viewBox="0 0 512 512"
          xmlSpace="preserve"
        >
          <g>
            <path
              style={{ fill: "#F69348" }}
              d="M183.949,188.453c-29.125,18.531-66.773,18.531-95.898,0L45.5,161.375
		c-1.414-0.902-3.043-1.375-4.719-1.375c-4.844,0-8.781,3.938-8.781,8.781V304h445.535c-4.859-15.434-16.555-28.328-32.078-34.297
		l-42.949-16.52c-11.344-4.363-22.566-9.441-33.352-15.086L244.41,172.754c-12.098-6.332-26.793-5.719-38.332,1.617L183.949,188.453
		z"
            />
            <path
              style={{ fill: "#003B54" }}
              d="M456.941,239.836l-42.945-16.52c-10.203-3.922-20.293-8.488-29.992-13.566l-124.742-65.34
		c-22.234-11.645-49.199-10.516-70.363,2.961l-22.129,14.082c-18.691,11.895-42.848,11.902-61.539,0L62.68,134.379
		C56.129,130.207,48.555,128,40.781,128C18.293,128,0,146.293,0,168.781V320v48c0,8.836,7.164,16,16,16h480c8.836,0,16-7.164,16-16
		v-48C512,284.715,489.875,252.5,456.941,239.836z M32,168.781c0-4.844,3.938-8.781,8.781-8.781c1.676,0,3.305,0.473,4.719,1.375
		l42.551,27.078c29.125,18.531,66.773,18.531,95.898,0l22.129-14.082c11.539-7.336,26.234-7.949,38.332-1.617l124.746,65.344
		c10.785,5.645,22.008,10.723,33.352,15.086l42.949,16.52c15.523,5.969,27.219,18.863,32.078,34.297H32V168.781z M480,352H32v-16
		h448V352z"
            />
            <rect
              x="32"
              y="336"
              style={{ fill: "#D0D2D3" }}
              width="448"
              height="16"
            />
            <path
              style={{ fill: "#FFFFFF" }}
              d="M334.625,304l55.771-55.77c-7.204-3.119-14.313-6.507-21.239-10.132l-9.108-4.771L289.375,304
		H334.625z"
            />
            <polygon
              style={{ fill: "#FFFFFF" }}
              points="254.625,304 337.244,221.381 307.548,205.827 209.375,304 	"
            />
            <path
              style={{ fill: "#FFFFFF" }}
              d="M174.625,304l108.688-108.688c0.476-0.475,0.914-0.974,1.317-1.491l-29.581-15.495L129.375,304
		H174.625z"
            />
          </g>
        </svg>
      </div>
    </section>
  );
};

export default LoadingScreen;

import "./ArrowIndicator.css";

const ArrowIndicator = ({ direction }) => {
  const oppositeDirection = (Number(direction) + 180) % 360;

  return (
    <div className="arrow-container">
      <svg
        className="compass-svg"
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer compass circle */}
        <circle className="compass-ring" cx="32" cy="32" r="29" />

        {/* Degree markings every 10 degrees */}
        {Array.from({ length: 36 }, (_, i) => {
          const angle = i * 10;
          const isMajor = angle % 30 === 0;

          return (
            <line
              key={angle}
              className={isMajor ? "compass-tick major" : "compass-tick"}
              x1="32"
              y1={isMajor ? "6" : "7"}
              x2="32"
              y2={isMajor ? "12" : "10"}
              transform={`rotate(${angle} 32 32)`}
            />
          );
        })}

        {/* Original rotating arrow */}
        <g
          className="arrow-rotate"
          style={{ "--rotation": `${oppositeDirection}deg` }}
        >
          <svg
            className="arrow-svg"
            x="14"
            y="14"
            width="36"
            height="36"
            viewBox="0 0 22 22"
          >
            <path d="M12 2L15 8H9L12 2Z" className="arrow-head" />
            <path d="M11 8V22H13V8H11Z" className="arrow-body" />
          </svg>
        </g>
      </svg>
    </div>
  );
};

export default ArrowIndicator;

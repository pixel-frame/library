import React from "react";

const iconPaths = {
  star: {
    paths: [
      {
        d: "M3.08539 7.91211L0.665414 2.34016L2.83459 0.17099L8.40653 2.59097C9.42298 3.03242 10.577 3.03242 11.5935 2.59097L17.1654 0.17099L19.3346 2.34016L16.9146 7.91211C16.4731 8.92855 16.4731 10.0826 16.9146 11.099L19.3346 16.671L17.1654 18.8402L11.5935 16.4202C10.577 15.9787 9.42298 15.9787 8.40653 16.4202L2.83457 18.8402L0.665405 16.671L3.08539 11.099C3.52685 10.0826 3.52685 8.92855 3.08539 7.91211ZM17.1454 2.36016L12.3902 4.42542C10.8655 5.08761 9.13447 5.08761 7.6098 4.42542L2.85458 2.36016L4.91985 7.11538C5.58203 8.64004 5.58203 10.3711 4.91985 11.8958L2.85458 16.651L7.6098 14.5857C9.13447 13.9235 10.8655 13.9235 12.3902 14.5857L17.1454 16.651L15.0801 11.8958C14.418 10.3711 14.418 8.64005 15.0801 7.11538L17.1454 2.36016Z",
        fillRule: "evenodd",
        clipRule: "evenodd",
        fill: "var(--bg-primary)",
      },
    ],
  },
  leaf: {
    paths: [
      {
        d: "M2.32422 17.0632L17.3242 2.06317",
        stroke: "var(--bg-primary)",
        strokeWidth: 2,
        fill: "none",
      },
      {
        d: "M6.82422 3.56317V12.5632H14.8242",
        stroke: "var(--bg-primary)",
        strokeWidth: 2,
        fill: "none",
      },
      {
        d: "M16.2385 0.291127L3.91339 3.91615C1.78547 4.54201 0.324219 6.49494 0.324219 8.71298V15.72C0.324219 17.3769 1.66736 18.72 3.32422 18.72H9.49416C11.6141 18.72 13.5036 17.3832 14.2091 15.3841L18.6758 2.72847L16.2385 0.291127ZM4.47772 5.83488L16.7304 2.23114L12.3231 14.7185C11.8998 15.9179 10.7661 16.72 9.49416 16.72H3.32422C2.77193 16.72 2.32422 16.2723 2.32422 15.72V8.71298C2.32422 7.38215 3.20097 6.2104 4.47772 5.83488Z",
        fillRule: "evenodd",
        clipRule: "evenodd",
        fill: "var(--bg-primary)",
      },
    ],
  },
  config: {
    viewBox: "0 0 22 20",
    paths: [
      {
        d: "M19.0893 8.50557L15.9107 3C15.5534 2.3812 14.8932 2 14.1786 2L7.82134 2C7.10681 2 6.44656 2.3812 6.08929 3L2.91065 8.50557C2.55338 9.12437 2.55338 9.88677 2.91065 10.5056L6.08929 16.0111C6.44656 16.6299 7.10681 17.0111 7.82134 17.0111L14.1786 17.0111C14.8932 17.0111 15.5534 16.6299 15.9107 16.0111L19.0893 10.5056C19.4466 9.88677 19.4466 9.12437 19.0893 8.50557ZM17.6427 2C16.9282 0.762396 15.6077 -2.31412e-08 14.1786 0L7.82134 4.9178e-08C6.39228 -1.42143e-07 5.07177 0.762398 4.35724 2L1.1786 7.50557C0.464066 8.74317 0.464068 10.268 1.1786 11.5056L4.35724 17.0111C5.07177 18.2487 6.39228 19.0111 7.82134 19.0111L14.1786 19.0111C15.6077 19.0111 16.9282 18.2487 17.6427 17.0111L20.8214 11.5056C21.5359 10.268 21.5359 8.74317 20.8214 7.50557L17.6427 2Z",
        fillRule: "evenodd",
        clipRule: "evenodd",
        fill: "var(--bg-primary)",
      },
      {
        d: "M1.77985 9.24722H20.2798",
        stroke: "var(--bg-primary)",
        strokeWidth: 2,
        fill: "none",
      },
      {
        d: "M10.7798 1.24722L6.27985 9.24722L10.7798 18.2472",
        stroke: "var(--bg-primary)",
        strokeWidth: 2,
        fill: "none",
      },
      {
        d: "M11.2798 1.24722L15.7798 9.24722L11.2798 18.2472",
        stroke: "var(--bg-primary)",
        strokeWidth: 2,
        fill: "none",
      },
    ],
  },
  // Add more icons as needed
};

const Icon = ({ name, size = 24, className = "", onClick, ariaLabel, testId, active = false }) => {
  if (!iconPaths[name]) {
    console.error(`Icon "${name}" not found`);
    return null;
  }

  const iconData = iconPaths[name];

  const handleKeyDown = (e) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick(e);
    }
  };

  const containerStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: size,
    height: size,
  };

  // Use text-primary when active, bg-primary when inactive
  const fillColor = active ? "var(--text-primary)" : "var(--bg-primary)";
  const strokeColor = active ? "var(--text-primary)" : "var(--bg-primary)";

  return (
    <div
      style={containerStyle}
      className={className}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel || `${name} icon`}
      data-testid={testId || `icon-${name}`}
    >
      {Array.isArray(iconData.paths) ? (
        <svg
          width={size}
          height={size}
          viewBox={iconData.viewBox || "0 0 19 19"}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {iconData.paths.map((pathData, index) => (
            <path
              key={index}
              d={pathData.d}
              stroke={pathData.stroke ? strokeColor : undefined}
              strokeWidth={pathData.strokeWidth}
              fill={pathData.fill === "var(--bg-primary)" ? fillColor : pathData.fill}
              fillRule={pathData.fillRule}
              clipRule={pathData.clipRule}
            />
          ))}
        </svg>
      ) : (
        <svg width={size} height={size} viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d={iconData} fill={fillColor} />
        </svg>
      )}
    </div>
  );
};

export default Icon;

import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = "20px",
  borderRadius = "12px",
  className = "",
  style = {},
}) => {
  return (
    <div
      className={`skeleton-loading ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background:
          "linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0.05) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1s infinite linear",
        ...style,
      }}
    />
  );
};

// Add global CSS for the animation
const injectGlobalCSS = () => {
  if (
    typeof document !== "undefined" &&
    !document.getElementById("skeleton-styles")
  ) {
    const style = document.createElement("style");
    style.id = "skeleton-styles";
    style.innerHTML = `
      @keyframes shimmer {
        0% {
          background-position: 100% 0;
        }
        100% {
          background-position: -100% 0;
        }
      }
      .skeleton-loading {
        overflow: hidden;
        position: relative;
      }
    `;
    document.head.appendChild(style);
  }
};

// Inject the CSS when this module is imported
if (typeof window !== "undefined") {
  injectGlobalCSS();
}

export default Skeleton;

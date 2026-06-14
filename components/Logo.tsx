import React from "react";
import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "image" | "text" | "combined";
  lightMode?: boolean;
}

export default function Logo({
  size = "md",
  className = "",
  variant = "combined",
  lightMode = true,
}: LogoProps) {
  const dimensions = {
    sm: { img: 24, font: "text-lg", pad: "px-1.5 py-0.5 rounded-sm" },
    md: { img: 36, font: "text-2xl", pad: "px-2 py-0.5 rounded-md" },
    lg: { img: 48, font: "text-3xl", pad: "px-3 py-1 rounded-lg" },
    xl: { img: 56, font: "text-4xl", pad: "px-4 py-1 rounded-xl" },
  }[size];

  // Combined renders the image logo icon (containing the red U) followed by "shop" styled wordmark
  if (variant === "combined") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative flex items-center justify-center">
          <Image
            src={size === "lg" || size === "xl" ? "/logo-large.png" : "/logo.png"}
            alt="U-Shop Logo Icon"
            width={dimensions.img}
            height={dimensions.img}
            className="object-contain"
            priority
          />
        </div>
        <span className={`font-sans font-black ${dimensions.font} tracking-tight select-none`}>
          <span className={lightMode ? "text-brand-purple" : "text-white"}>sh</span>
          <span className="text-brand-magenta">op</span>
        </span>
      </div>
    );
  }

  // Pure image rendering (the entire logo png)
  if (variant === "image") {
    return (
      <div className={`flex items-center ${className}`}>
        <Image
          src={size === "lg" || size === "xl" ? "/logo-large.png" : "/logo.png"}
          alt="U-Shop Logo"
          width={dimensions.img}
          height={dimensions.img}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  // HTML CSS text-only reproduction (e.g., U in red box, sh in purple, op in magenta)
  return (
    <div className={`flex items-center gap-1 font-sans font-black ${dimensions.font} tracking-tight ${className}`}>
      <span className={`bg-[#FF0000] text-white ${dimensions.pad} leading-none flex items-center justify-center font-black shadow-sm`}>
        U
      </span>
      <span className={lightMode ? "text-[#5D1A89]" : "text-white"}>sh</span>
      <span className="text-[#D1148A]">op</span>
    </div>
  );
}

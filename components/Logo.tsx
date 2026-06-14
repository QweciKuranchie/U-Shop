import React from "react";
import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: string;
  lightMode?: boolean;
}

export default function Logo({
  size = "md",
  className = "",
}: LogoProps) {
  // Increased sizes to make the logo icon significantly more visible
  const dimensions = {
    sm: { img: 36 },
    md: { img: 48 },
    lg: { img: 64 },
    xl: { img: 80 },
  }[size];

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src={size === "lg" || size === "xl" ? "/logo-large.png" : "/logo.png"}
        alt="U-Shop Logo"
        width={dimensions.img}
        height={dimensions.img}
        className="object-contain transition-transform duration-200 hover:scale-105"
        priority
      />
    </div>
  );
}

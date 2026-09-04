import React, { useEffect, useState } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
  trigger: any;
  direction?: "fade" | "slide-up" | "slide-left" | "slide-right";
}

export default function PageTransition({ children, trigger, direction = "fade" }: PageTransitionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 25);
    return () => clearTimeout(timer);
  }, [trigger]);

  const getTransitionClass = () => {
    switch (direction) {
      case "slide-up":
        return visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-3 scale-[0.995]";
      case "slide-left":
        return visible
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-3";
      case "slide-right":
        return visible
          ? "opacity-100 translate-x-0"
          : "opacity-0 -translate-x-3";
      case "fade":
      default:
        return visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.99]";
    }
  };

  return (
    <div className={`transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${getTransitionClass()}`}>
      {children}
    </div>
  );
}

import React from 'react';

interface ReflectionCardProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  "aria-label"?: string;
}

const ReflectionCard: React.FC<ReflectionCardProps> = ({
  children,
  className = "",
  style,
  onClick,
  "aria-label": ariaLabel
}) => {
  const classes = ["reflection-card", className].filter(Boolean).join(" ");
  const isInteractive = !!onClick;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (event.key === 'Enter' || event.key === " ")) {
      event.preventDefault();
      onClick(event as any as React.MouseEvent<HTMLDivElement>);
    }
  };

  return (
    <div 
      className={classes}
      style={style}
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? "button" : "region"}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
};

export { ReflectionCard };
export default ReflectionCard;
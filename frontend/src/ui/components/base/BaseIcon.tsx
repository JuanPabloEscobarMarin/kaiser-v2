import type { IconName } from "../icons/Icons";
import { icons } from "../icons/Icons";

interface Props {
  icon: IconName;
  size?: number;
  color?: string;
  className?: string;
  viewBox?: string;
}

export function BaseIcon({
  icon,
  size = 24,
  color = "currentColor",
  className,
  viewBox = "0 0 16 16",
}: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {icons[icon]}
    </svg>
  );
}

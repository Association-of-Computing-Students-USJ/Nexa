import { useCountUp } from "../../hooks/useCountUp";

type AnimatedStatProps = {
  value: string | number;
  label: string;
  light?: boolean;
};

export default function AnimatedStat({ value, label, light = false }: AnimatedStatProps) {
  const { ref, display } = useCountUp(value);

  return (
    <div>
      <span ref={ref as React.RefObject<HTMLSpanElement>} className="text-4xl font-bold text-[#19D1E6]">
        {display}
      </span>
      <p className={`text-sm mt-1 ${light ? "text-gray-500" : "text-[#888888]"}`}>{label}</p>
    </div>
  );
}

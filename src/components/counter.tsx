import { useMemo } from "react";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils";
import { ScoreWheel } from "./score-wheel";
import { useFormData, useDeltaTimeNow } from "@/lib/hooks";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

function DaysScrollWheel({ days }: { days: number }) {
  const nums = useMemo(
    () =>
      String(days)
        .padStart(2, "0")
        .split("")
        .map((n) => parseInt(n)),
    [days]
  );
  return nums.map((num, i) => <ScoreWheel key={`${i}`} num={num} />);
}

function TextSegment({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-[45px] h-[5rem] flex justify-center items-center",
        className
      )}
    >
      <span className="text-[5rem]">{text}</span>
    </div>
  );
}

export function Counter({ className }: { className?: string }) {
  const {
    data: { endDate, digits },
  } = useFormData();
  const isTMinus = useMemo(() => endDate > DateTime.now(), [endDate]);
  const deltaTime = useDeltaTimeNow(endDate);

  const displays = useMemo(() => {
    const _displays = [];
    if (digits.includes("d"))
      _displays.push(
        <Tooltip key="d">
          <TooltipTrigger asChild>
            <div className="flex px-2">
              <DaysScrollWheel days={deltaTime.days} />
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="[text-shadow:none] max-sm:hidden"
          >
            {isTMinus ? "Remaining" : "Elapsed"} days
          </TooltipContent>
        </Tooltip>
      );
    if (digits.includes("h"))
      _displays.push(
        <Tooltip key="h">
          <TooltipTrigger asChild>
            <div className="flex px-2">
              <ScoreWheel num={deltaTime.hours} max={23} />
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="[text-shadow:none] max-sm:hidden"
          >
            {isTMinus ? "Remaining" : "Elapsed"} hours
          </TooltipContent>
        </Tooltip>
      );
    if (digits.includes("m"))
      _displays.push(
        <Tooltip key="m">
          <TooltipTrigger asChild>
            <div className="flex px-2">
              <ScoreWheel num={deltaTime.minutes} max={59} />
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="[text-shadow:none] max-sm:hidden"
          >
            {isTMinus ? "Remaining" : "Elapsed"} minutes
          </TooltipContent>
        </Tooltip>
      );
    if (digits.includes("s"))
      _displays.push(
        <Tooltip key="s">
          <TooltipTrigger asChild>
            <div className="flex px-2">
              <ScoreWheel num={deltaTime.seconds} max={59} />
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="[text-shadow:none] max-sm:hidden"
          >
            {isTMinus ? "Remaining" : "Elapsed"} seconds
          </TooltipContent>
        </Tooltip>
      );
    return _displays.length
      ? _displays.reduce(
          (acc, val, index) => [
            ...acc,
            ...(index > 0
              ? [
                  <TextSegment
                    key={`del-${index}`}
                    text={":"}
                    className="w-[20px]"
                  />,
                ]
              : []),
            val,
          ],
          [] as JSX.Element[]
        )
      : _displays;
  }, [deltaTime, digits, isTMinus]);

  return (
    <div className={cn("flex", className)}>
      <TextSegment text="T" />
      <TextSegment text={isTMinus ? "-" : "+"} />
      {displays}
    </div>
  );
}

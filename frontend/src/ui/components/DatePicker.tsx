import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

export function DatePicker() {
    const [selected, setSelected] = useState<Date>();
    const [time, setTime] = useState<string>();

    useEffect(() => {
    const timeSplit = time?.split(':');

    if (timeSplit === undefined) return;

    const date = selected?.setHours(Number(timeSplit[0]), Number(timeSplit[1]));

    if (!date) return;

    console.log(new Date(date))
  }, [selected, time])
    
    return (
        <>
            <button popoverTarget="rdp-popover" className="input input-border" style={{ anchorName: "--rdp" } as React.CSSProperties}>
                {selected ? selected.toLocaleDateString() : "Pick a date"}
            </button>
            <div popover="auto" id="rdp-popover" className="dropdown" style={{ positionAnchor: "--rdp" } as React.CSSProperties}>
                <DayPicker className="react-day-picker" mode="single" selected={selected} onSelect={setSelected} disabled={[new Date(2026, 0, 9)]} />
            </div>

            <input type="time" className="input" onChange={(e) => setTime(e.target.value)} />
        </>
    )
}
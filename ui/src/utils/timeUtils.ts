/**
 * Chuyển đổi chuỗi thời gian (ví dụ: '1h30m', '45m', '2h') thành số phút.
 */
export const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    let totalMinutes = 0;
    const hoursMatch = timeStr.match(/(\d+)\s*h/i);
    const minsMatch = timeStr.match(/(\d+)\s*m/i);

    if (hoursMatch) totalMinutes += parseInt(hoursMatch[1], 10) * 60;
    if (minsMatch) totalMinutes += parseInt(minsMatch[1], 10);
    if (!hoursMatch && !minsMatch) {
        const num = parseFloat(timeStr);
        if (!isNaN(num)) totalMinutes = num;
    }
    return totalMinutes;
};

/**
 * Định dạng số phút thành chuỗi thời gian dạng '--h--m' hoặc '--m' (nếu 0h).
 * Ví dụ: 15 -> '15m', 75 -> '1h15m', 0 -> '0m'.
 */
export const formatMinutesToHhMm = (mins: number): string => {
    if (!mins || mins <= 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h${m}m`;
};

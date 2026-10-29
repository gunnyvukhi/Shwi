/**
 * Phân tích chuỗi cân nặng (hỗ trợ cả dấu chấm và dấu phẩy), kiểm tra khoảng hợp lệ [min, max]
 * và làm tròn đến 1 chữ số thập phân.
 * 
 * @param raw Chuỗi cân nặng người dùng nhập (ví dụ: '65', '70.5', '68,2')
 * @param min Giới hạn dưới hợp lệ (mặc định 20kg)
 * @param max Giới hạn trên hợp lệ (mặc định 300kg)
 * @returns Số cân nặng hợp lệ đã làm tròn 1 chữ số thập phân, hoặc null nếu không hợp lệ
 */
export const parseKg = (raw: string, min: number = 20, max: number = 300): number | null => {
    if (!raw || !raw.trim()) return null;
    const n = parseFloat(raw.replace(',', '.'));
    if (isNaN(n) || n < min || n > max) return null;
    return +n.toFixed(1);
};

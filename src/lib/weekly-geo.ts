/**
 * Toạ độ nhiệm vụ tuần (chủ game 05/11), đo trên 3 trang ảnh (tím / vàng / xanh lá), tính theo % khung của từng hàng cắt (900×196).
 * star = tâm ô sao [x, y], starW/starH = cỡ ô sao thường; tube = mép trên/dưới ống (chỉ trang tím); fill = đầu/cuối phần đầy; num = lề trái chữ số;
 * digit = chữ số "n" trong "(Xn)" ở tên nhiệm vụ [tâm x, tâm y, cao] (chỉ 2 hàng X3).
 */
export type WeekRow = { star: [number, number]; starW: number; starH: number; tube?: [number, number]; fill?: [number, number]; num?: [number]; digit?: [number, number, number] };
export const WEEK_GEO: Record<"p" | "g" | "d", WeekRow[]> = {
  p: [
    {star: [86.33, 51.12], starW: 26.67, starH: 76.53, tube: [70.59, 84.71], fill: [40.36, 69.53], num: [29.69], digit: [50.33, 49.41, 14.12]},
    {star: [86.33, 51.38], starW: 26.67, starH: 76.53, tube: [71.76, 84.71], fill: [40.36, 69.53], num: [29.69], digit: [50.52, 50.0, 14.12]},
    {star: [86.33, 50.74], starW: 26.67, starH: 76.53, tube: [69.88, 83.13], fill: [40.36, 69.53], num: [29.69]},
    {star: [86.33, 50.61], starW: 26.67, starH: 76.53, tube: [69.46, 83.23], fill: [40.36, 69.53], num: [29.69]},
    {star: [86.33, 51.12], starW: 26.67, starH: 76.53, tube: [70.12, 83.54], fill: [40.36, 69.53], num: [29.69]},
    {star: [86.33, 51.12], starW: 26.67, starH: 76.53, tube: [69.94, 83.44], fill: [40.36, 69.53], num: [29.69]},
    {star: [86.33, 50.87], starW: 26.67, starH: 76.53, tube: [70.93, 84.3], fill: [40.36, 69.53], num: [29.69]},
  ],
  g: [
    {star: [84.96, 50.74], starW: 26.67, starH: 76.53, digit: [49.94, 46.58, 14.91]},
    {star: [84.96, 50.74], starW: 26.67, starH: 76.53, digit: [49.94, 46.27, 15.53]},
    {star: [84.96, 50.36], starW: 26.67, starH: 76.53},
    {star: [84.96, 49.97], starW: 26.67, starH: 76.53},
    {star: [84.96, 50.1], starW: 26.67, starH: 76.53},
    {star: [84.96, 51.25], starW: 26.67, starH: 76.53},
    {star: [84.96, 51.38], starW: 26.67, starH: 76.53},
  ],
  d: [
    {star: [86.42, 51.89], starW: 23.54, starH: 76.1, digit: [50.78, 45.6, 15.72]},
    {star: [86.42, 52.61], starW: 23.54, starH: 79.08, digit: [50.84, 45.42, 16.34]},
    {star: [86.42, 52.03], starW: 23.54, starH: 81.76},
    {star: [86.42, 52.36], starW: 23.54, starH: 81.76},
    {star: [86.42, 54.03], starW: 23.54, starH: 81.21},
    {star: [86.42, 53.69], starW: 23.54, starH: 81.21},
    {star: [86.42, 52.55], starW: 23.54, starH: 77.07},
  ],
};

export type Settings = {
  speed: number;
  commentary: boolean;
};

export const speeds = [
  { label: "2×", pace: 4 },
  { label: "4×", pace: 8 },
  { label: "6×", pace: 12 },
];

export const defaultSettings: Settings = { speed: speeds[0].pace, commentary: true };

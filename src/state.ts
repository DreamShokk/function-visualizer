// Shared application state: what the user controls via the UI panel.

export type ColorMode = 'height' | 'gradient' | 'wireframe';

export interface AppState {
  functionExpr: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  resolution: number;
  colorMode: ColorMode;
  opacity: number;
  autoRotate: boolean;
}

export const defaultState: AppState = {
  functionExpr: 'sin(x)*cos(y)',
  xMin: -5,
  xMax: 5,
  yMin: -5,
  yMax: 5,
  resolution: 30,
  colorMode: 'height',
  opacity: 0.85,
  autoRotate: false,
};

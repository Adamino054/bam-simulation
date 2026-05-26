export const TOTAL_QUARTERS = 20
export const FREE_MODE_QUARTERS = 25
export const YEARS = 5
export const POTENTIAL_GROWTH = 3.0 // % annuel, croissance potentielle marocaine
export const INFLATION_TARGET = 2.0 // % cible CBS

export const SCORE_THRESHOLDS = {
  A: 85,
  B: 70,
  C: 55,
  D: 40,
} as const

export const POLICY_RATE_BOUNDS = {
  min: 0.5,  // borne basse effective
  max: 10.0,
  stepBp: 25,
  changeBpMin: -100,
  changeBpMax: 100,
} as const

export const RESERVE_REQ_BOUNDS = {
  min: 0.0,
  max: 20.0,
  stepBp: 50,
  changeBpMin: -200,
  changeBpMax: 200,
} as const

export const MARKET_OPS_OPTIONS = [-20, -10, 0, 10, 20] as const // mds MAD

export const FX_INTERVENTION_OPTIONS = [-10, 0, 10, 20, 30] as const // mds MAD

export const EMERGENCY_LENDING_OPTIONS = [0, 5, 10, 20] as const // mds MAD

export const CCYB_OPTIONS = [0, 0.5, 1.0, 1.5, 2.0, 2.5] as const // %

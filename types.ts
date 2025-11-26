
export type Stage = 'ones' | 'tens' | 'done';

export interface GameState {
  dividend: number;
  divisor: number;
  tens: number;
  ones: number;
  tensDivisor: number;
  onesDivisor: number;
  stage: Stage;
  voice: boolean;
  log: string[];
  onesInput: string;
  tensInput: string;
}

export type GameAction =
  | { type: 'SET_PROBLEM'; payload: { dividend: number; divisor: number } }
  | { type: 'BORROW_TEN' }
  | { type: 'COMBINE_ONES' }
  | { type: 'PROCESS_ONES' }
  | { type: 'PROCESS_TENS' }
  | { type: 'TOGGLE_VOICE' }
  | { type: 'RESET_PROBLEM' }
  | { type: 'ADD_LOG'; payload: string }
  | { type: 'SET_ONES_INPUT'; payload: string }
  | { type: 'SET_TENS_INPUT'; payload: string };

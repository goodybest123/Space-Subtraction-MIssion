import type { GameState, GameAction } from '../types';

const initialProblem = { dividend: 43, divisor: 28 };

export function calculateProblemState(dividend: number, divisor: number): Partial<GameState> {
  const d = Math.max(0, dividend);
  const dv = Math.max(0, divisor);
  const ones = d % 10;
  const onesDivisor = dv % 10;
  return {
    dividend: d,
    divisor: dv,
    tens: Math.floor(d / 10),
    ones: ones,
    tensDivisor: Math.floor(dv / 10),
    onesDivisor: onesDivisor,
    stage: 'ones',
    log: [
      `Let's start with the ones column. We need to subtract ${onesDivisor} from ${ones}.`,
      `Problem loaded: ${d} − ${dv}`
    ],
    onesInput: '',
    tensInput: '',
  };
}

export const initialState: GameState = {
  ...calculateProblemState(initialProblem.dividend, initialProblem.divisor),
  voice: true,
  log: [],
} as GameState;

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PROBLEM':
      return {
        ...state,
        ...calculateProblemState(action.payload.dividend, action.payload.divisor),
      };
    case 'RESET_PROBLEM':
        return {
            ...state,
            ...calculateProblemState(state.dividend, state.divisor),
        };
    case 'ADD_LOG':
      return { ...state, log: [action.payload, ...state.log] };
    case 'BORROW_TEN':
      if (state.tens > 0) {
        return {
          ...state,
          tens: state.tens - 1,
          ones: state.ones + 10,
        };
      }
      return state;
    case 'COMBINE_ONES':
        if(state.ones >= 10){
            return {
                ...state,
                tens: state.tens + 1,
                ones: state.ones - 10,
            }
        }
        return state;
    case 'PROCESS_ONES':
      if (state.ones >= state.onesDivisor) {
        return {
          ...state,
          ones: state.ones - state.onesDivisor,
          stage: 'tens',
        };
      }
      return state;
    case 'PROCESS_TENS':
      if (state.tens >= state.tensDivisor) {
        return {
          ...state,
          tens: state.tens - state.tensDivisor,
          stage: 'done',
        };
      }
      return state;
    case 'TOGGLE_VOICE':
      return { ...state, voice: !state.voice };
    case 'SET_ONES_INPUT':
      return { ...state, onesInput: action.payload };
    case 'SET_TENS_INPUT':
      return { ...state, tensInput: action.payload };
    default:
      return state;
  }
}

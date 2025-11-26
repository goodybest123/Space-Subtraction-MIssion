import React, { useReducer, useEffect, useState, useCallback, useMemo } from 'react';
import type { GameState, GameAction, Stage } from './types';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { gameReducer, initialState } from './state/gameReducer';
import { DraggableItem } from './components/DraggableItem';


const App: React.FC = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { speak } = useSpeechSynthesis(state.voice);
  const [customDividend, setCustomDividend] = useState(initialState.dividend);
  const [customDivisor, setCustomDivisor] = useState(initialState.divisor);
  const [isThrusterAnimating, setThrusterAnimating] = useState(false);

  useEffect(() => {
    speak(`Loaded problem ${state.dividend} minus ${state.divisor}. Start with ones.`);
  }, [state.dividend, state.divisor, speak]);

  const addLog = useCallback((message: string) => {
    dispatch({ type: 'ADD_LOG', payload: message });
  }, []);

  const handleSetProblem = (d: number, dv: number) => {
    dispatch({ type: 'SET_PROBLEM', payload: { dividend: d, divisor: dv } });
    setCustomDividend(d);
    setCustomDivisor(dv);
  };
  
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [d, dv] = e.target.value.split(',').map(Number);
    handleSetProblem(d, dv);
  };

  const handleCustomSet = () => {
    handleSetProblem(customDividend, customDivisor);
  };
  
  const handleNewProblem = () => {
    const a = Math.floor(Math.random() * 90) + 10;
    const b = Math.floor(Math.random() * Math.min(98, a)) + 1;
    handleSetProblem(a, b);
  };

  const handleDrop = (area: 'tens' | 'ones') => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (area === 'ones' && data.type === 'tens') {
            if (state.tens > 0) {
              dispatch({ type: 'BORROW_TEN' });
              addLog(`Borrowed: 1 ten rod converted to 10 ones.`);
              addLog(`You now have ${state.tens - 1} tens and ${state.ones + 10} ones.`);
              addLog(`The ones column problem is now: ${state.ones + 10} - ${state.onesDivisor}. Please enter the answer.`);
              speak(`Borrow one ten. You now have ${state.ones + 10} ones.`);
            } else {
              speak('No tens to convert.');
            }
        } else if (area === 'tens' && data.type === 'ones') {
            if (state.ones >= 10) {
                dispatch({ type: 'COMBINE_ONES' });
                addLog('Combined 10 ones into 1 ten rod.');
                speak('Combined ten ones into a ten rod.');
            } else {
                speak('Not enough ones to combine into ten.');
            }
        }
    } catch (err) {
        console.warn('Drop parse error', err);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  
  const finalizeAnswer = (tens: number, ones: number) => {
    const finalAnswer = tens * 10 + ones;
    addLog(`Mission complete! Combining the results: ${tens} tens and ${ones} ones.`);
    addLog(`Final answer: ${finalAnswer}`);
    speak(`Nice work. The final answer is ${finalAnswer}`);
    setThrusterAnimating(true);
    setTimeout(() => setThrusterAnimating(false), 600);
  };

  const handleCheckStep = () => {
    if (state.stage === 'ones') {
      if (state.ones >= state.onesDivisor) {
        const correctOnesAnswer = state.ones - state.onesDivisor;
        const userOnesAnswer = parseInt(state.onesInput, 10);

        if (userOnesAnswer === correctOnesAnswer) {
            addLog(`Correct! ${state.ones} − ${state.onesDivisor} = ${correctOnesAnswer}. The ones place is solved.`);
            addLog(`Now, let's solve the tens column: ${state.tens} − ${state.tensDivisor}.`);
            speak(`Correct. ${state.ones} minus ${state.onesDivisor} is ${correctOnesAnswer}. Now, subtract the tens.`);
            dispatch({ type: 'PROCESS_ONES' });
        } else {
            addLog(`That's not the right answer for the ones. Let's try again: what is ${state.ones} − ${state.onesDivisor}?`);
            speak(`That's not quite right. Check your subtraction for the ones place.`);
        }
      } else {
        addLog(`Ones column: We can't subtract ${state.onesDivisor} from ${state.ones} because ${state.ones} is smaller. A borrow is required.`);
        speak(`You don't have enough ones. Drag a tens rod into the ones area to borrow.`);
      }
    } else if (state.stage === 'tens') {
      if (state.tens >= state.tensDivisor) {
        const correctTensAnswer = state.tens - state.tensDivisor;
        const userTensAnswer = parseInt(state.tensInput, 10);

        if (userTensAnswer === correctTensAnswer) {
            addLog(`Perfect! ${state.tens} − ${state.tensDivisor} = ${correctTensAnswer}. The tens place is solved.`);
            speak(`Correct. ${state.tens} minus ${state.tensDivisor} is ${correctTensAnswer}.`);
            dispatch({ type: 'PROCESS_TENS' });
            finalizeAnswer(correctTensAnswer, state.ones);
        } else {
            addLog(`Not quite right for the tens column. Please re-check: what is ${state.tens} − ${state.tensDivisor}?`);
            speak(`Not quite. Re-check the tens calculation.`);
        }
      } else {
        addLog(`Error: Not enough tens (${state.tens}) to subtract ${state.tensDivisor}.`);
        speak('There seems to be an error. Not enough tens to subtract.');
      }
    } else if (state.stage === 'done') {
      speak('This problem is already solved. Try a new one!');
      addLog('Problem already solved. Click "New Problem" to start another.');
    }
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const autoSolve = async () => {
    speak('Auto solving demonstration. Watch carefully.');
    
    // Create a clean state based on the current problem for our simulation
    let currentState = gameReducer({ ...state, stage: 'ones', log: [] }, { type: 'RESET_PROBLEM' });
    dispatch({ type: 'RESET_PROBLEM' }); // Dispatch to trigger a re-render to the initial state
    
    await delay(100); // Give react time to render

    if (currentState.ones < currentState.onesDivisor) {
        if (currentState.tens > 0) {
            await delay(600);
            const action = { type: 'BORROW_TEN' } as const;
            dispatch(action);
            const stateAfterBorrow = gameReducer(currentState, action);
            addLog(`Auto-Borrow: Converting 1 ten to 10 ones. We now have ${stateAfterBorrow.ones} ones.`);
            currentState = stateAfterBorrow;
            speak(`Auto-borrowing. You now have ${currentState.ones} ones.`);
        }
    }
    await delay(700);

    if (currentState.ones >= currentState.onesDivisor) {
        const action = { type: 'PROCESS_ONES' } as const;
        const onesBefore = currentState.ones;
        const resultOnes = onesBefore - currentState.onesDivisor;
        addLog(`Auto-Solve Ones: ${onesBefore} − ${currentState.onesDivisor} = ${resultOnes}.`);
        dispatch(action);
        currentState = gameReducer(currentState, action);
        speak(`Subtracting ones. ${resultOnes} ones remain.`);
    }

    await delay(900);

    if (currentState.tens >= currentState.tensDivisor) {
        const action = { type: 'PROCESS_TENS' } as const;
        const tensBefore = currentState.tens;
        const resultTens = tensBefore - currentState.tensDivisor;
        addLog(`Auto-Solve Tens: ${tensBefore} − ${currentState.tensDivisor} = ${resultTens}.`);
        dispatch(action);
        const finalState = gameReducer(currentState, action);
        speak(`Subtracting tens. ${resultTens} tens remain.`);
        finalizeAnswer(finalState.tens, finalState.ones);
    }
  };
  
  const handleBorrowHelper = () => {
    if (state.tens > 0) {
      dispatch({ type: 'BORROW_TEN' });
      addLog(`Auto-Borrow: 1 ten rod converted to 10 ones.`);
      addLog(`You now have ${state.tens - 1} tens and ${state.ones + 10} ones.`);
      addLog(`The ones column problem is now: ${state.ones + 10} - ${state.onesDivisor}. Please enter the answer.`);
      speak(`Auto borrow performed. You now have ${state.ones + 10} ones.`);
    } else {
      speak('No tens available to borrow.');
    }
  };

  const answerPreview = useMemo(() => {
    if (state.stage === 'done') {
      return state.tens * 10 + state.ones;
    }
    return '—';
  }, [state.stage, state.tens, state.ones]);

  return (
    <div className="p-4 md:p-6 border-2 border-[#4a90e2] min-h-screen flex flex-col">
      <header className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-[#ffd166]">Space Subtraction Mission</h1>
        <p className="text-[#9aa7c7] text-base ml-2 hidden sm:block">Help Captain Nova manage power units by subtracting & borrowing!</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 flex-grow">
        {/* Left: Scene */}
        <section className="bg-gradient-to-b from-white/5 to-white/[.01] rounded-xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(1200px_400px_at_20%_10%,rgba(80,20,140,0.16),transparent_5%),radial-gradient(1000px_300px_at_85%_80%,rgba(10,200,220,0.06),transparent_6%)] opacity-90"></div>
          <div className="absolute w-[140px] h-[140px] bg-gradient-to-b from-[#2a2f6f] to-[#1b214a] rounded-full shadow-lg right-12 top-12 opacity-90"></div>
          <div className="absolute w-[200px] h-[200px] bg-gradient-to-b from-[#3b2b6a] to-[#1a1236] rounded-full shadow-lg left-12 top-20"></div>

          <div className="relative z-10 flex flex-col lg:flex-row gap-6 h-full">
            {/* Left Column */}
            <div className="lg:w-[550px] shrink-0 space-y-4">
              <div className="bg-white/5 p-5 rounded-lg">
                <div className="text-[#9aa7c7] text-base mb-1.5">Current Problem</div>
                <div className="flex gap-2 items-center justify-between">
                  <div className="text-5xl font-extrabold">
                    <span>{state.dividend}</span>
                    <span className="mx-3 text-2xl text-[#9aa7c7]">-</span>
                    <span>{state.divisor}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[#9aa7c7] text-base">Answer</div>
                    <div className="text-4xl text-[#ffd166] font-black">{answerPreview}</div>
                  </div>
                </div>
                <p className="mt-4 text-[#9aa7c7] text-sm">Solve ones first. If you don't have enough ones, borrow a ten rod.</p>
                
                {state.stage === 'ones' && state.ones >= state.onesDivisor && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <label htmlFor="ones-input" className="text-lg font-semibold text-white/90">Solve Ones:</label>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-2xl font-bold w-12 text-center">{state.ones}</span>
                      <span className="text-xl text-[#9aa7c7]">-</span>
                      <span className="text-2xl font-bold w-12 text-center">{state.onesDivisor}</span>
                      <span className="text-xl text-[#9aa7c7]">=</span>
                      <input
                        id="ones-input"
                        type="number"
                        value={state.onesInput}
                        onChange={(e) => dispatch({ type: 'SET_ONES_INPUT', payload: e.target.value })}
                        className="w-24 p-2 rounded-lg border-0 bg-[#0b2344] text-white/90 text-2xl font-bold text-center"
                        placeholder="?"
                        aria-label="Ones answer"
                      />
                    </div>
                  </div>
                )}

                {state.stage === 'tens' && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <label htmlFor="tens-input" className="text-lg font-semibold text-white/90">Solve Tens:</label>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-2xl font-bold w-12 text-center">{state.tens}</span>
                      <span className="text-xl text-[#9aa7c7]">-</span>
                      <span className="text-2xl font-bold w-12 text-center">{state.tensDivisor}</span>
                      <span className="text-xl text-[#9aa7c7]">=</span>
                      <input
                        id="tens-input"
                        type="number"
                        value={state.tensInput}
                        onChange={(e) => dispatch({ type: 'SET_TENS_INPUT', payload: e.target.value })}
                        className="w-24 p-2 rounded-lg border-0 bg-[#0b2344] text-white/90 text-2xl font-bold text-center"
                        placeholder="?"
                        aria-label="Tens answer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white/5 p-5 rounded-lg">
                  <div className="text-[#9aa7c7] text-base mb-1.5">Energy Pools</div>
                  <div className="flex gap-5 p-4">
                      <div className="flex-1">
                          <div className="text-[#9aa7c7] text-base mb-1.5">Tens (rods)</div>
                          <div onDrop={handleDrop('tens')} onDragOver={handleDragOver} className="min-h-[220px] rounded-lg p-4 flex flex-wrap gap-3 content-start">
                              {Array.from({ length: state.tens }).map((_, i) => <DraggableItem key={`t-${i}`} type="tens" id={`t-${i}`} />)}
                          </div>
                      </div>
                      <div className="flex-1">
                          <div className="text-[#9aa7c7] text-base mb-1.5">Ones (orbs)</div>
                          <div onDrop={handleDrop('ones')} onDragOver={handleDragOver} className="min-h-[220px] rounded-lg p-4 flex flex-wrap gap-3 content-start">
                              {Array.from({ length: state.ones }).map((_, i) => <DraggableItem key={`o-${i}`} type="ones" id={`o-${i}`} />)}
                          </div>
                      </div>
                  </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="flex-1 flex flex-col">
              <div className="bg-white/5 p-4 rounded-lg flex flex-col h-full">
                <div className="text-[#9aa7c7] text-base mb-1.5">Mission Log</div>
                <div className="overflow-auto bg-gradient-to-b from-white/5 to-white/[.01] p-3 rounded-lg text-base flex flex-col-reverse flex-grow">
                  <div>
                    {state.log.map((msg, i) => <p key={i} className="mb-1.5">{msg}</p>)}
                  </div>
                </div>
                <div className="flex gap-3 items-center mt-4">
                    <button onClick={handleCheckStep} className="bg-[#122440] text-[#9aa7c7] text-sm py-2 px-4 rounded-lg border border-white/5 cursor-pointer hover:bg-white/10">Check Step</button>
                    <button onClick={autoSolve} className="bg-[#122440] text-[#9aa7c7] text-sm py-2 px-4 rounded-lg border border-white/5 cursor-pointer hover:bg-white/10">Auto Solve</button>
                    <button onClick={handleNewProblem} className="bg-[#122440] text-[#9aa7c7] text-sm py-2 px-4 rounded-lg border border-white/5 cursor-pointer hover:bg-white/10">New Problem</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Controls */}
        <aside className="bg-gradient-to-b from-white/5 to-white/[.01] rounded-xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-extrabold text-xl">Mission Controls</h2>
            <div className="text-[#9aa7c7] text-base">Space Subtraction</div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 items-center">
              <label className="text-[#9aa7c7] text-base">Pick example:</label>
              <select onChange={handlePresetChange} defaultValue="43,28" className="flex-1 p-2.5 rounded-lg bg-[#081632] border-0 text-white/90 text-base">
                <option value="43,28">43 − 28 (Borrowing)</option>
                <option value="35,12">35 − 12 (No borrow)</option>
                <option value="70,46">70 − 46 (Borrow from 70)</option>
                <option value="50,13">50 − 13 (Borrow from 50)</option>
              </select>
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-[#9aa7c7] text-base">Or custom:</label>
              <input type="number" min="0" value={customDividend} onChange={e => setCustomDividend(Number(e.target.value))} className="w-full p-2 rounded-lg border-0 bg-[#0b2344] text-white/90 px-2 text-base" />
              <input type="number" min="0" value={customDivisor} onChange={e => setCustomDivisor(Number(e.target.value))} className="w-full p-2 rounded-lg border-0 bg-[#0b2344] text-white/90 px-2 text-base" />
              <button onClick={handleCustomSet} className="bg-[#122440] text-[#9aa7c7] py-2 px-4 rounded-lg border border-white/5 cursor-pointer hover:bg-white/10 text-sm whitespace-nowrap">Set</button>
            </div>
            <div className="flex gap-2 items-center">
              <label htmlFor="voiceToggle" className="text-[#9aa7c7] text-base">Voice feedback</label>
              <input id="voiceToggle" type="checkbox" checked={state.voice} onChange={() => dispatch({ type: 'TOGGLE_VOICE' })} className="accent-[#ffd166]" />
            </div>
            <div className="text-[#9aa7c7] text-base">Instruction</div>
            <div className="bg-white/5 p-3 rounded-lg text-[#9aa7c7] text-base">
              Follow the steps: solve the ones column first. If needed, borrow a ten by dragging a rod to the ones area. Enter your answer and press <strong>Check Step</strong>.
            </div>
            <div className="flex gap-2">
              <button onClick={handleBorrowHelper} className="bg-[#122440] text-[#9aa7c7] text-sm py-2 px-4 rounded-lg border border-white/5 cursor-pointer hover:bg-white/10">Auto Borrow</button>
            </div>
             <div className="text-[#9aa7c7] text-base mt-6">Sound effects and voice supported in many browsers.</div>

            {/* Captain Nova Status */}
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="w-[220px] h-[170px] bg-gradient-to-b from-[#c8f0ff] to-[#6bd6ff] rounded-3xl shadow-2xl flex items-center justify-center flex-col text-[#07112b] font-extrabold">
                <div className="text-2xl">Captain Nova</div>
                <div className="text-sm text-[#02334d]">Power Control</div>
                <div className={`w-7 h-7 rounded-md bg-[#ffd166] mt-2 opacity-90 transition-all duration-150 ease-in-out ${isThrusterAnimating ? 'scale-150 shadow-[0_12px_40px_rgba(255,193,7,0.6)]' : 'scale-100'}`}></div>
              </div>
              <div className="mt-4 text-center">
                <div className="text-lg text-white/90 font-bold">{`Stage: ${state.stage.toUpperCase()} — Ones: ${state.ones} | Tens: ${state.tens}`}</div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="mt-6 text-[#9aa7c7] text-center text-base">Space Subtraction Mission • Drag tens rod to convert into 10 ones.</footer>
    </div>
  );
};

export default App;
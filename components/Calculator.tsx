import React, { useState, useEffect } from 'react';
import { CalculationHistory } from '../types';
import { Delete } from 'lucide-react';
import { evaluate } from 'mathjs';

interface CalculatorProps {
  history: CalculationHistory[];
  onHistoryUpdate: (newHistory: CalculationHistory[]) => void;
}

const Calculator: React.FC<CalculatorProps> = ({ history, onHistoryUpdate }) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [newNumberStarted, setNewNumberStarted] = useState(true);

  const processNumber = (num: string) => {
    if (newNumberStarted) {
      setDisplay(num);
      setNewNumberStarted(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const processOperator = (op: string) => {
    setExpression(display + ' ' + op + ' ');
    setNewNumberStarted(true);
  };

  const processEqual = () => {
    if (!expression) return;

    const fullExpr = expression + display;
    const evalExpr = fullExpr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-');

    try {
      const result = evaluate(evalExpr);

      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Invalid calculation');
      }

      const formatResult = String(Math.round(result * 100000000) / 100000000);

      setDisplay(formatResult);
      setExpression('');
      setNewNumberStarted(true);

      const newHistoryItem: CalculationHistory = {
        id: Date.now().toString(),
        expression: fullExpr,
        result: formatResult
      };

      const updatedHistory = [newHistoryItem, ...history].slice(0, 50);
      onHistoryUpdate(updatedHistory);

    } catch {
      setDisplay('Error');
      setNewNumberStarted(true);
      setExpression('');
    }
  };

  const processClear = () => {
    setDisplay('0');
    setExpression('');
    setNewNumberStarted(true);
  };

  const processBackspace = () => {
    if (newNumberStarted) return;

    if (display.length === 1) {
      setDisplay('0');
      setNewNumberStarted(true);
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const processSpecial = (type: 'sqr' | 'inv' | 'neg' | 'percent') => {
    const current = parseFloat(display);
    if (isNaN(current)) return;

    let result = 0;

    switch(type) {
      case 'sqr': result = current * current; break;
      case 'inv': result = 1 / current; break;
      case 'neg': result = -current; break;
      case 'percent': result = current / 100; break;
    }

    setDisplay(String(Math.round(result * 100000000) / 100000000));
    setNewNumberStarted(true);
  };

  // Keyboard Support (optimized deps)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;

      const key = e.key;

      if (/[0-9]/.test(key)) {
        e.preventDefault();
        processNumber(key);
      } else if (key === '.') {
        e.preventDefault();
        processNumber('.');
      } else if (['+', '-', '*', '/'].includes(key)) {
        e.preventDefault();
        const opMap: Record<string, string> = { '*': '×', '/': '÷', '+': '+', '-': '−' };
        processOperator(opMap[key] || key);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        processEqual();
      } else if (key === 'Backspace') {
        e.preventDefault();
        processBackspace();
      } else if (key === 'Escape') {
        e.preventDefault();
        processClear();
      } else if (key === '%') {
        e.preventDefault();
        processSpecial('percent');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, onHistoryUpdate, display, expression, newNumberStarted]);

  const Button = ({ 
    label, 
    onClick, 
    type = 'normal', 
    className = '' 
  }: { 
    label: React.ReactNode, 
    onClick: () => void, 
    type?: 'normal' | 'accent' | 'action',
    className?: string 
  }) => {
    let bgClass = 'bg-[#333333] hover:bg-[#444444] text-gray-200';
    if (type === 'accent') bgClass = 'bg-cyan-400 hover:bg-cyan-300 text-black font-bold';
    if (type === 'action') bgClass = 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-400';

    return (
      <button
        onClick={onClick}
        aria-label={typeof label === 'string' ? label : 'Calculator button'}
        className={`${bgClass} rounded-lg h-12 w-full flex items-center justify-center text-sm transition-colors duration-150 active:scale-95 ${className}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-stretch justify-center p-2 md:p-4 w-full">
      <div className="bg-[#1e1e1e] p-4 md:p-6 rounded-3xl shadow-2xl border border-gray-800 w-full md:w-[360px] shrink-0">
        
        <div className="mb-6 text-right h-24 flex flex-col justify-end p-2" role="status" aria-live="polite">
          <div className="text-gray-500 text-xs h-4 mb-1">{expression}</div>
          <div className="text-5xl font-light text-gray-100 tracking-wide overflow-hidden whitespace-nowrap">
            {display}
          </div>
        </div>

        <div className="flex justify-between mb-4 text-[10px] text-gray-500 font-medium px-1">
          <span>MC</span><span>MR</span><span>M+</span><span>M-</span><span>MS</span><span>Mv</span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <Button label={<Delete size={18}/>} type="action" onClick={processBackspace} />
          <Button label="%" type="action" onClick={() => processSpecial('percent')} />
          
          

          
          <Button label={<span>x<sup>2</sup></span>} type="action" onClick={() => processSpecial('sqr')} />
          
          <Button label="÷" type="action" onClick={() => processOperator('÷')} />
          

          <Button label="7" onClick={() => processNumber('7')} />
          <Button label="8" onClick={() => processNumber('8')} />
          <Button label="9" onClick={() => processNumber('9')} />
          <Button label="×" type="action" onClick={() => processOperator('×')} />

          <Button label="4" onClick={() => processNumber('4')} />
          <Button label="5" onClick={() => processNumber('5')} />
          <Button label="6" onClick={() => processNumber('6')} />
          <Button label="−" type="action" onClick={() => processOperator('−')} />

          <Button label="1" onClick={() => processNumber('1')} />
          <Button label="2" onClick={() => processNumber('2')} />
          <Button label="3" onClick={() => processNumber('3')} />
          <Button label="+" type="action" onClick={() => processOperator('+')} />

          <Button label="+/-" type="action" onClick={() => processSpecial('neg')} />
          <Button label="0" onClick={() => processNumber('0')} />
          <Button label="." type="action" onClick={() => processNumber('.')} />
          <Button label="=" type="accent" onClick={processEqual} />
        </div>
      </div>

      <div className="bg-[#404040] rounded-3xl p-4 md:p-6 shadow-lg w-full md:w-[360px] shrink-0 flex flex-col border border-gray-700/50 h-[300px] md:h-auto">
        <div className="flex justify-between items-center mb-4 px-2 shrink-0">
          <h2 className="text-gray-300 text-sm font-medium">History</h2>
          <button 
            onClick={() => onHistoryUpdate([])}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
          {history.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p className="text-xs">No history</p>
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} className="flex flex-col items-end px-3 py-2 bg-[#333] rounded-xl border border-gray-600/30">
                <div className="text-gray-400 text-xs mb-1">{item.expression} =</div>
                <div className="text-lg text-cyan-400 font-light">{item.result}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Calculator;

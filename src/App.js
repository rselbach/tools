import React, { useState, useEffect } from 'react';
import './App.css';

const LETTER_STATES = {
  GRAY: 'gray',
  YELLOW: 'yellow',
  GREEN: 'green'
};

function App() {
  const [rows, setRows] = useState(() => Array(6).fill(null).map(() => createEmptyRow()));
  const [wordList, setWordList] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [useCommonWords, setUseCommonWords] = useState(false);
  const [wordLimit, setWordLimit] = useState(20);
  const [showInstructions, setShowInstructions] = useState(false);

  function createEmptyRow() {
    return Array(5).fill(null).map(() => ({
      letter: '',
      state: LETTER_STATES.GRAY
    }));
  }

  // load wordlist when toggle changes
  useEffect(() => {
    const wordlistFile = useCommonWords ? 'common.txt' : 'wordlist.txt';
    fetch(`/${wordlistFile}`)
      .then(response => response.text())
      .then(text => {
        const words = text.split('\n').filter(word => word.trim().length === 5);
        setWordList(words);
        setFilteredWords(words.slice(0, wordLimit));
      })
      .catch(error => console.error('Error loading wordlist:', error));
  }, [useCommonWords]);

  // filter words based on current state
  useEffect(() => {
    if (wordList.length === 0) return;
    
    const filtered = wordList.filter(word => {
      word = word.toUpperCase();
      
      // collect all constraints
      const greenLetters = {}; // position -> letter
      const yellowLetters = {}; // letter -> positions where it can't be
      const grayLetters = new Set();
      
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const hasLetters = row.some(cell => cell.letter !== '');
        if (!hasLetters) continue;
        
        for (let colIndex = 0; colIndex < 5; colIndex++) {
          const cell = row[colIndex];
          if (cell.letter === '') continue;
          
          if (cell.state === LETTER_STATES.GREEN) {
            greenLetters[colIndex] = cell.letter;
          } else if (cell.state === LETTER_STATES.YELLOW) {
            if (!yellowLetters[cell.letter]) {
              yellowLetters[cell.letter] = new Set();
            }
            yellowLetters[cell.letter].add(colIndex);
          } else if (cell.state === LETTER_STATES.GRAY) {
            grayLetters.add(cell.letter);
          }
        }
      }
      
      // check green letters (must be in exact position)
      for (const [position, letter] of Object.entries(greenLetters)) {
        if (word[position] !== letter) return false;
      }
      
      // check yellow letters (must be in word but not in specified positions)
      for (const [letter, positions] of Object.entries(yellowLetters)) {
        if (!word.includes(letter)) return false;
        for (const position of positions) {
          if (word[position] === letter) return false;
        }
      }
      
      // check gray letters (must not be in word, unless they're also green/yellow elsewhere)
      for (const letter of grayLetters) {
        // only exclude if the letter isn't required elsewhere
        if (!greenLetters[Object.keys(greenLetters).find(pos => greenLetters[pos] === letter)] &&
            !yellowLetters[letter]) {
          if (word.includes(letter)) return false;
        }
      }
      
      return true;
    });
    
    setFilteredWords(filtered.slice(0, wordLimit));
  }, [rows, wordList, wordLimit]);

  // add global keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      
      // handle letter input - find first empty cell and fill it
      if (key.length === 1 && key >= 'A' && key <= 'Z') {
        e.preventDefault();
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          for (let colIndex = 0; colIndex < 5; colIndex++) {
            if (rows[rowIndex][colIndex].letter === '') {
              const newRows = [...rows];
              newRows[rowIndex][colIndex].letter = key;
              
              // check previous rows for same letter in same position and copy the color
              for (let prevRowIndex = rowIndex - 1; prevRowIndex >= 0; prevRowIndex--) {
                if (rows[prevRowIndex][colIndex].letter === key) {
                  newRows[rowIndex][colIndex].state = rows[prevRowIndex][colIndex].state;
                  break; // use the most recent matching color
                }
              }
              
              setRows(newRows);
              return; // exit after filling the first empty cell
            }
          }
        }
      } 
      // handle backspace - find last filled cell and clear it
      else if (e.key === 'Backspace') {
        e.preventDefault();
        for (let rowIndex = rows.length - 1; rowIndex >= 0; rowIndex--) {
          for (let colIndex = 4; colIndex >= 0; colIndex--) {
            if (rows[rowIndex][colIndex].letter !== '') {
              const newRows = [...rows];
              newRows[rowIndex][colIndex].letter = '';
              newRows[rowIndex][colIndex].state = LETTER_STATES.GRAY; // reset color to gray
              setRows(newRows);
              return; // exit after clearing the last filled cell
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [rows]);

  // handle virtual keyboard input
  const handleVirtualKeyPress = (key) => {
    if (key === 'BACKSPACE') {
      // handle backspace
      for (let rowIndex = rows.length - 1; rowIndex >= 0; rowIndex--) {
        for (let colIndex = 4; colIndex >= 0; colIndex--) {
          if (rows[rowIndex][colIndex].letter !== '') {
            const newRows = [...rows];
            newRows[rowIndex][colIndex].letter = '';
            newRows[rowIndex][colIndex].state = LETTER_STATES.GRAY;
            setRows(newRows);
            return;
          }
        }
      }
    } else {
      // handle letter input
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        for (let colIndex = 0; colIndex < 5; colIndex++) {
          if (rows[rowIndex][colIndex].letter === '') {
            const newRows = [...rows];
            newRows[rowIndex][colIndex].letter = key;
            
            // check previous rows for same letter in same position and copy the color
            for (let prevRowIndex = rowIndex - 1; prevRowIndex >= 0; prevRowIndex--) {
              if (rows[prevRowIndex][colIndex].letter === key) {
                newRows[rowIndex][colIndex].state = rows[prevRowIndex][colIndex].state;
                break;
              }
            }
            
            setRows(newRows);
            return;
          }
        }
      }
    }
  };

  const handleCellClick = (rowIndex, colIndex) => {
    // only cycle the state if the cell has a letter
    const cell = rows[rowIndex][colIndex];
    if (cell.letter === '') {
      return; // do nothing for empty cells
    }
    
    const newRows = [...rows];
    const currentState = newRows[rowIndex][colIndex].state;
    
    let nextState;
    switch (currentState) {
      case LETTER_STATES.GRAY:
        nextState = LETTER_STATES.YELLOW;
        break;
      case LETTER_STATES.YELLOW:
        nextState = LETTER_STATES.GREEN;
        break;
      case LETTER_STATES.GREEN:
        nextState = LETTER_STATES.GRAY;
        break;
      default:
        nextState = LETTER_STATES.GRAY;
    }
    
    // update this cell and all matching cells (same letter, same position)
    const letter = cell.letter;
    for (let r = 0; r < newRows.length; r++) {
      if (newRows[r][colIndex].letter === letter) {
        newRows[r][colIndex].state = nextState;
      }
    }
    
    setRows(newRows);
  };

  return (
    <div className="App">
      <div className="header">
        <h1>Wordle Solver</h1>
        <button 
          className="help-button" 
          onClick={() => setShowInstructions(!showInstructions)}
          aria-label="Toggle instructions"
        >
          ?
        </button>
      </div>
      {showInstructions && (
        <div className="instructions">
          <p>Enter letters and click to change colours:</p>
          <ul>
            <li><span className="gray-example">Gray</span> - Letter not in word</li>
            <li><span className="yellow-example">Yellow</span> - Letter in word, wrong position</li>
            <li><span className="green-example">Green</span> - Letter in correct position</li>
          </ul>
        </div>
      )}
      <div className="main-container">
        <div className="left-panel">
          <h2>Enter Your Guesses</h2>
          <div className="wordle-grid">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="wordle-row">
                {row.map((cell, colIndex) => (
                  <div
                    key={colIndex}
                    className={`wordle-cell ${cell.state}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {cell.letter}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="right-panel">
          <h2>Possible Words ({filteredWords.length}{wordList.length > 0 && filteredWords.length >= wordLimit ? '+' : ''})</h2>
          <div className="word-list">
            {filteredWords.length > 0 ? (
              filteredWords.map((word, index) => (
                <div key={index} className="word-item">
                  {word.toUpperCase().split('').map((letter, letterIndex) => {
                    // determine letter color based on constraints
                    let letterClass = '';
                    
                    // check if this letter in this position is green (confirmed correct)
                    const isGreen = rows.some(row => 
                      row[letterIndex].letter === letter && 
                      row[letterIndex].state === LETTER_STATES.GREEN
                    );
                    
                    // check if this letter appears as yellow anywhere (in word but wrong position)
                    const isYellow = !isGreen && rows.some(row => 
                      row.some(cell => 
                        cell.letter === letter && 
                        cell.state === LETTER_STATES.YELLOW
                      )
                    );
                    
                    if (isGreen) {
                      letterClass = 'letter-green';
                    } else if (isYellow) {
                      letterClass = 'letter-yellow';
                    }
                    
                    return (
                      <span key={letterIndex} className={letterClass}>
                        {letter}
                      </span>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="no-words">No matching words found</div>
            )}
          </div>
          <div className="word-filters">
            <div className="word-limit-selector">
              <label htmlFor="word-limit">Show: </label>
              <select 
                id="word-limit" 
                value={wordLimit} 
                onChange={(e) => setWordLimit(parseInt(e.target.value))}
              >
                <option value={10}>10 words</option>
                <option value={20}>20 words</option>
                <option value={50}>50 words</option>
                <option value={100}>100 words</option>
              </select>
            </div>
            <div className="wordlist-toggle">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={useCommonWords}
                  onChange={(e) => setUseCommonWords(e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Common words only</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Virtual Keyboard for Mobile */}
      <div className="virtual-keyboard">
        <div className="keyboard-row">
          {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map(letter => (
            <button 
              key={letter} 
              className="keyboard-key"
              onClick={() => handleVirtualKeyPress(letter)}
            >
              {letter}
            </button>
          ))}
        </div>
        <div className="keyboard-row">
          {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map(letter => (
            <button 
              key={letter} 
              className="keyboard-key"
              onClick={() => handleVirtualKeyPress(letter)}
            >
              {letter}
            </button>
          ))}
        </div>
        <div className="keyboard-row">
          {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map(letter => (
            <button 
              key={letter} 
              className="keyboard-key"
              onClick={() => handleVirtualKeyPress(letter)}
            >
              {letter}
            </button>
          ))}
          <button 
            className="keyboard-key keyboard-backspace"
            onClick={() => handleVirtualKeyPress('BACKSPACE')}
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
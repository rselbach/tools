import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const LETTER_STATES = {
  GRAY: 'gray',
  YELLOW: 'yellow',
  GREEN: 'green'
};

function App() {
  const [rows, setRows] = useState(() => Array(6).fill(null).map(() => createEmptyRow()));
  const [focusedCell, setFocusedCell] = useState({ row: 0, col: 0 });
  const [wordList, setWordList] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [useCommonWords, setUseCommonWords] = useState(false);
  const hiddenInputRef = useRef(null);

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
        setFilteredWords(words.slice(0, 20));
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
    
    setFilteredWords(filtered.slice(0, 20));
  }, [rows, wordList]);

  useEffect(() => {
    // keep hidden input focused for keyboard events
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  }, [focusedCell]);

  const handleKeyInput = (e) => {
    const { row, col } = focusedCell;
    const key = e.key.toUpperCase();
    
    // handle letter input
    if (key.length === 1 && key >= 'A' && key <= 'Z') {
      const newRows = [...rows];
      newRows[row][col].letter = key;
      setRows(newRows);
      
      // move focus to next cell if not at end of row
      if (col < 4) {
        setFocusedCell({ row, col: col + 1 });
      } else if (row < 5) {
        // move to first cell of next row if not on last row
        setFocusedCell({ row: row + 1, col: 0 });
      }
    }
  };

  const handleKeyDown = (e) => {
    const { row, col } = focusedCell;
    
    if (e.key === 'Backspace') {
      e.preventDefault();
      const currentCell = rows[row][col];
      
      if (currentCell.letter === '') {
        if (col > 0) {
          // if current cell is empty and not first in row, move to previous cell in same row
          setFocusedCell({ row, col: col - 1 });
          // clear the previous cell
          const newRows = [...rows];
          newRows[row][col - 1].letter = '';
          setRows(newRows);
        } else if (row > 0) {
          // if current cell is empty and is first in row, move to last cell of previous row
          setFocusedCell({ row: row - 1, col: 4 });
        }
      } else {
        // clear current cell
        const newRows = [...rows];
        newRows[row][col].letter = '';
        setRows(newRows);
        
        if (col > 0) {
          // move to previous cell in same row
          setFocusedCell({ row, col: col - 1 });
        } else if (row > 0) {
          // if at beginning of row, move to last cell of previous row
          setFocusedCell({ row: row - 1, col: 4 });
        }
      }
    } else if (e.key === 'ArrowLeft' && col > 0) {
      setFocusedCell({ row, col: col - 1 });
    } else if (e.key === 'ArrowRight' && col < 4) {
      setFocusedCell({ row, col: col + 1 });
    } else if (e.key === 'ArrowUp' && row > 0) {
      setFocusedCell({ row: row - 1, col });
    } else if (e.key === 'ArrowDown' && row < 5) {
      setFocusedCell({ row: row + 1, col });
    }
  };

  const handleCellClick = (rowIndex, colIndex) => {
    // set focus to clicked cell
    setFocusedCell({ row: rowIndex, col: colIndex });
    
    // cycle the state
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
    
    newRows[rowIndex][colIndex].state = nextState;
    setRows(newRows);
  };

  return (
    <div className="App">
      <h1>Wordle Solver</h1>
      <div className="main-container">
        <div className="left-panel">
          <div className="instructions">
            <p>Enter letters and click to change colours:</p>
            <ul>
              <li><span className="gray-example">Gray</span> - Letter not in word</li>
              <li><span className="yellow-example">Yellow</span> - Letter in word, wrong position</li>
              <li><span className="green-example">Green</span> - Letter in correct position</li>
            </ul>
          </div>
          <div className="wordlist-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={useCommonWords}
                onChange={(e) => setUseCommonWords(e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Limit to common words</span>
            </label>
          </div>
          <div className="wordle-grid">
            {/* Hidden input to capture keyboard events */}
            <input
              ref={hiddenInputRef}
              type="text"
              className="hidden-input"
              onKeyDown={handleKeyDown}
              onKeyPress={handleKeyInput}
              aria-hidden="true"
              tabIndex={-1}
            />
            
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="wordle-row">
                {row.map((cell, colIndex) => (
                  <div
                    key={colIndex}
                    className={`wordle-cell ${cell.state} ${
                      focusedCell.row === rowIndex && focusedCell.col === colIndex ? 'focused' : ''
                    }`}
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
          <h2>Possible Words ({filteredWords.length}{wordList.length > 0 && filteredWords.length >= 20 ? '+' : ''})</h2>
          <div className="word-list">
            {filteredWords.length > 0 ? (
              filteredWords.map((word, index) => (
                <div key={index} className="word-item">
                  {word.toUpperCase()}
                </div>
              ))
            ) : (
              <div className="no-words">No matching words found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
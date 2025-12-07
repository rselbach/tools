Wordle wordlist ranker (Go)

Overview
- Scores and reorders a 5-letter word list using two signals:
  1) Global letter presence frequency (unique letters per word)
  2) Letter-by-position frequency
- Trailing 's' is ignored unless preceded by another 's' (e.g., "fades" ignores the final s; "bliss" counts it).

Build & Run
- Prereqs: Go 1.21+
- From `util/`:
  - `go run ./rankwords.go -in wordlist.txt -out wordlist_ranked.txt`
  - Or build: `go build -o rankwords ./rankwords.go` then `./rankwords -in wordlist.txt -out wordlist_ranked.txt`

CLI Flags
- `-in` (string, default `wordlist.txt`): input file path.
- `-out` (string, default `wordlist_ranked.txt`): output file path.
- `-len` (int, default `5`): word length filter.
- `-letter-weight` (float, default `1.0`): weight for the global letter component.
- `-position-weight` (float, default `1.0`): weight for the per-position component.
- `-unique-weight` (float, default `0.0`): [deprecated] extra bonus per unique letter (prefer adjusting `-letter-weight`).
- `-plural-penalty` (float, default `0.75`): subtracts this value from a word's score if it's likely a simple plural (e.g., ends with `s`, `es`, `ies`, `ves`). Set to `0` to disable.
- `-dedupe` (bool, default `true`): remove duplicate lines before scoring.
- `-lower` (bool, default `true`): normalize to lowercase.

Scoring
- Compute per-letter presence across words and per-position frequencies (applying the trailing-`s` rule).
- Score(word) = `letter-weight` * sum_unique(letter_prob[letter]) + `position-weight` * sum_i(pos_prob[i][word[i]]).
  - Unique letters are counted once per word; positions include duplicates.
  - Optional `-plural-penalty` still applies after the above.

Input/Output
- Input expects one word per line (ASCII letters), typically 5 letters.
- Output is a reordered list with the same words, best-first.

Notes
- The program does not modify the existing list in-place; it writes to `-out`.
- If your app fetches lists from `public/`, copy the output into `public/` as needed.

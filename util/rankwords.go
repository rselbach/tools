package main

import (
  "bufio"
  "errors"
  "flag"
  "fmt"
  "log"
  "os"
  "path/filepath"
  "sort"
  "strings"
  "unicode"
)

type wordScore struct {
  word  string
  score float64
}

func main() {
  inPath := flag.String("in", "wordlist.txt", "input word list (one 5-letter word per line)")
  outPath := flag.String("out", "wordlist_ranked.txt", "output file path (reordered list)")
  length := flag.Int("len", 5, "word length to analyze")
  // New scoring knobs
  letterFactor := flag.Float64("letter-weight", 1.0, "weight multiplier for global letter frequency component")
  positionFactor := flag.Float64("position-weight", 1.0, "weight multiplier for per-position frequency component")
  // Legacy option retained for compatibility (set 0 to disable)
  uniqueWeight := flag.Float64("unique-weight", 0.0, "[deprecated] extra bonus per unique letter (prefer tuning letter-weight)")
  pluralPenalty := flag.Float64("plural-penalty", 0.75, "penalty applied if a word is likely a simple plural (set 0 to disable)")
  dedupe := flag.Bool("dedupe", true, "remove duplicate words before scoring")
  lowercase := flag.Bool("lower", true, "normalize words to lowercase")
  flag.Parse()

  words, err := readWords(*inPath, *length, *lowercase)
  if err != nil {
    log.Fatalf("read: %v", err)
  }

  if *dedupe {
    words = deduplicate(words)
  }

  if len(words) == 0 {
    log.Fatalf("no words of length %d found in %s", *length, *inPath)
  }

  // Compute global letter presence frequencies and per-position frequencies,
  // applying the rule to ignore a trailing 's' unless preceded by another 's'.
  letterFreq, posCounts := computeFrequencies(words, *length)
  scores := scoreWordsByFrequencies(words, letterFreq, posCounts, *letterFactor, *positionFactor, *uniqueWeight, *pluralPenalty)

  // Sort by descending score; tie-break by lexicographic word asc for determinism.
  sort.SliceStable(scores, func(i, j int) bool {
    if scores[i].score == scores[j].score {
      return scores[i].word < scores[j].word
    }
    return scores[i].score > scores[j].score
  })

  if err := writeWords(*outPath, scores); err != nil {
    log.Fatalf("write: %v", err)
  }

  fmt.Printf("Reordered %d words from %s → %s\n", len(scores), cleanPath(*inPath), cleanPath(*outPath))
}

func cleanPath(p string) string {
  if abs, err := filepath.Abs(p); err == nil {
    return abs
  }
  return p
}

func readWords(path string, length int, toLower bool) ([]string, error) {
  f, err := os.Open(path)
  if err != nil {
    return nil, err
  }
  defer f.Close()

  var out []string
  s := bufio.NewScanner(f)
  // Increase buffer in case of long lines (paranoia, though words are short)
  buf := make([]byte, 0, 1024)
  s.Buffer(buf, 1024*1024)
  for s.Scan() {
    w := strings.TrimSpace(s.Text())
    if w == "" {
      continue
    }
    if toLower {
      w = strings.ToLower(w)
    }
    if !isAlphaASCII(w) {
      // Skip non-alpha lines; keeps the list clean.
      continue
    }
    if len(w) != length {
      continue
    }
    out = append(out, w)
  }
  if err := s.Err(); err != nil {
    return nil, err
  }
  if len(out) == 0 {
    return nil, errors.New("no words read")
  }
  return out, nil
}

func isAlphaASCII(s string) bool {
  for _, r := range s {
    if !unicode.IsLetter(r) || r > unicode.MaxASCII {
      return false
    }
  }
  return true
}

func deduplicate(words []string) []string {
  seen := make(map[string]struct{}, len(words))
  out := make([]string, 0, len(words))
  for _, w := range words {
    if _, ok := seen[w]; ok {
      continue
    }
    seen[w] = struct{}{}
    out = append(out, w)
  }
  return out
}

// positionCounts computes counts[pos][letterIndex] across the corpus.
// computeFrequencies returns:
// - letterFreq[l]: number of words that contain letter l at least once.
// - posCounts[pos][l]: number of words with letter l at position pos.
// While scanning, a trailing 's' is ignored unless preceded by another 's'.
func computeFrequencies(words []string, length int) ([]int, [][]int) {
  letterFreq := make([]int, 26)
  posCounts := make([][]int, length)
  for i := 0; i < length; i++ {
    posCounts[i] = make([]int, 26)
  }
  for _, w := range words {
    seen := make([]bool, 26)
    for i := 0; i < length; i++ {
      c := w[i]
      if skipTrailingS(w, i) {
        continue
      }
      idx := int(c - 'a')
      if idx < 0 || idx >= 26 {
        continue
      }
      posCounts[i][idx]++
      if !seen[idx] {
        seen[idx] = true
      }
    }
    for l := 0; l < 26; l++ {
      if seen[l] {
        letterFreq[l]++
      }
    }
  }
  return letterFreq, posCounts
}

// scoreWords ranks each word by the product of per-position frequencies.
// Implementation uses sum of logs for numerical stability:
//   score(w) = sum_i log(count[i][w[i]]) + uniqueWeight * uniqueCount(w)
// The constant normalization by corpus size cancels out for ordering, so it’s omitted.
// scoreWordsByFrequencies combines two signals:
// 1) Global letter presence frequency (unique letters per word)
// 2) Letter-by-position frequency
// A trailing 's' is ignored for both signals unless preceded by another 's'.
// Score(w) = letterWeight * sum_unique(letterProb[l]) + positionWeight * sum_i(posProb[i][w[i]])
// Optionally retains legacy uniqueWeight bonus and plural penalty.
func scoreWordsByFrequencies(words []string, letterFreq []int, posCounts [][]int, letterWeight, positionWeight, uniqueWeight, pluralPenalty float64) []wordScore {
  n := float64(len(words))
  // Convert to probabilities in [0,1].
  letterProb := make([]float64, 26)
  for l := 0; l < 26; l++ {
    letterProb[l] = float64(letterFreq[l]) / n
  }
  posProb := make([][]float64, len(posCounts))
  for i := range posCounts {
    posProb[i] = make([]float64, 26)
    for l := 0; l < 26; l++ {
      posProb[i][l] = float64(posCounts[i][l]) / n
    }
  }

  out := make([]wordScore, 0, len(words))
  for _, w := range words {
    // Unique letters within the word (respecting the trailing 's' rule)
    seen := 0
    letterSum := 0.0
    posSum := 0.0
    for i := 0; i < len(w); i++ {
      if skipTrailingS(w, i) {
        continue
      }
      idx := int(w[i] - 'a')
      if idx < 0 || idx >= 26 {
        continue
      }
      // Position component (include duplicates)
      posSum += posProb[i][idx]
      // Letter component (unique per word)
      bit := 1 << idx
      if seen&bit == 0 {
        seen |= bit
        letterSum += letterProb[idx]
      }
    }

    score := letterWeight*letterSum + positionWeight*posSum
    if uniqueWeight != 0 {
      score += uniqueWeight * float64(uniqueLetterCountRespectingRule(w))
    }
    if pluralPenalty > 0 && isLikelyPlural(w) {
      score -= pluralPenalty
    }
    out = append(out, wordScore{word: w, score: score})
  }
  return out
}

func uniqueLetterCount(w string) int {
  seen := 0
  for i := 0; i < len(w); i++ {
    bit := 1 << (w[i] - 'a')
    if seen&bit == 0 {
      seen |= bit
    }
  }
  // count bits
  count := 0
  for seen != 0 {
    seen &= seen - 1
    count++
  }
  return count
}

// uniqueLetterCountRespectingRule counts unique letters while ignoring
// a trailing 's' unless it is preceded by another 's'.
func uniqueLetterCountRespectingRule(w string) int {
  seen := 0
  for i := 0; i < len(w); i++ {
    if skipTrailingS(w, i) {
      continue
    }
    bit := 1 << (w[i] - 'a')
    if seen&bit == 0 {
      seen |= bit
    }
  }
  // count bits
  count := 0
  for seen != 0 {
    seen &= seen - 1
    count++
  }
  return count
}

// skipTrailingS returns true if character at index i of w is a final 's'
// and the preceding character is not 's'. This enforces the rule:
// ignore the letter 's' in the final position unless it is preceded by another 's'.
func skipTrailingS(w string, i int) bool {
  n := len(w)
  if i != n-1 {
    return false
  }
  if w[i] != 's' {
    return false
  }
  if n >= 2 && w[n-2] == 's' {
    return false
  }
  return true
}

func writeWords(path string, scores []wordScore) error {
  f, err := os.Create(path)
  if err != nil {
    return err
  }
  defer f.Close()
  bw := bufio.NewWriter(f)
  for _, ws := range scores {
    if _, err := bw.WriteString(ws.word + "\n"); err != nil {
      return err
    }
  }
  return bw.Flush()
}

// isLikelyPlural applies lightweight heuristics to identify common English plural forms.
// It intentionally favors high precision over recall; false positives are acceptable
// because Wordle rarely uses simple plurals as solutions.
func isLikelyPlural(w string) bool {
  n := len(w)
  if n < 4 { // too short to confidently call plural
    return false
  }
  // Exceptions: many singular words end with these suffixes.
  if strings.HasSuffix(w, "ss") {
    return false
  }
  if strings.HasSuffix(w, "us") || strings.HasSuffix(w, "is") {
    return false
  }
  // High-confidence plural patterns
  if strings.HasSuffix(w, "ies") { // party -> parties
    return true
  }
  if strings.HasSuffix(w, "ves") { // knife -> knives, wolf -> wolves
    return true
  }
  if strings.HasSuffix(w, "es") { // box -> boxes, bus -> buses, match -> matches
    return true
  }
  // Generic trailing 's' (avoid 'ss' above). This will also catch many 3rd-person verbs,
  // which is acceptable for ranking since answers rarely use simple plurals.
  if strings.HasSuffix(w, "s") {
    return true
  }
  return false
}

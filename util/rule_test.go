package main

import "testing"

func TestSkipTrailingS(t *testing.T) {
  if !skipTrailingS("fades", 4) { // trailing single s, should skip
    t.Errorf("expected skipTrailingS to be true for 'fades' at last index")
  }
  if skipTrailingS("bliss", 4) { // trailing s but preceded by s, should not skip
    t.Errorf("expected skipTrailingS to be false for 'bliss' at last index")
  }
  if skipTrailingS("class", 4) { // ends with ss, should not skip
    t.Errorf("expected skipTrailingS to be false for 'class' at last index")
  }
}

func TestFrequenciesIgnoreTrailingS(t *testing.T) {
  words := []string{"fades", "bliss", "aback"}
  letters, pos := computeFrequencies(words, 5)
  // letter 's' index
  si := int('s' - 'a')
  if letters[si] != 1 { // only 'bliss' should contribute to global letter presence
    t.Fatalf("letter 's' presence = %d, want 1", letters[si])
  }
  if pos[4][si] != 1 { // only 'bliss' should count at position 4
    t.Fatalf("pos[4]['s'] = %d, want 1", pos[4][si])
  }
}


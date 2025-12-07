package main

import "testing"

func TestIsLikelyPlural(t *testing.T) {
  cases := []struct {
    w    string
    want bool
  }{
    {"boxes", true},
    {"buses", true},
    {"flies", true},
    {"wolves", true},
    {"cards", true},
    {"glass", false}, // ends with ss
    {"cactus", false}, // ends with us (singular)
    {"basis", false},  // ends with is (singular)
    {"apple", false},
    {"tryst", false},
  }
  for _, tc := range cases {
    got := isLikelyPlural(tc.w)
    if got != tc.want {
      t.Errorf("isLikelyPlural(%q) = %v, want %v", tc.w, got, tc.want)
    }
  }
}


package main

import (
	"reflect"
	"testing"
)

func TestReorderArgs(t *testing.T) {
	cases := []struct {
		in   []string
		want []string
	}{
		{[]string{"cardo", "--report", "l1"}, []string{"--report", "l1", "cardo"}},
		{[]string{"--report", "l1", "cardo"}, []string{"--report", "l1", "cardo"}},
		{[]string{"cardo", "--all"}, []string{"--all", "cardo"}},
		{[]string{"zip:make", "--", "a", "b"}, []string{"zip:make", "--", "a", "b"}},
		{[]string{"--dir", "d", "--name", "n"}, []string{"--dir", "d", "--name", "n"}},
		{[]string{"pkg", "--version=1.0"}, []string{"--version=1.0", "pkg"}},
	}
	for _, c := range cases {
		if got := reorderArgs(c.in); !reflect.DeepEqual(got, c.want) {
			t.Fatalf("reorderArgs(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}

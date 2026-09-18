package scripts

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"

	"github.com/UNSAReport/tui/internal/project"
)

var KnownPrefixes = []string{"[linux:]", "[windows:]", "[macos:]", "[any:]"}

var HookStandards = project.HookStandards

// SplitPrefix splits an optional "[os:]" prefix from a hook alias reference.
// Bare entries return an empty prefix. Unknown or malformed prefixes are errors.
func SplitPrefix(entry string) (prefix, rest string, err error) {
	if !strings.HasPrefix(entry, "[") {
		return "", entry, nil
	}
	end := strings.Index(entry, "]")
	if end < 0 {
		return "", "", fmt.Errorf("malformed [os:] prefix in %q", entry)
	}
	prefix = entry[:end+1]
	rest = strings.TrimSpace(entry[end+1:])
	known := false
	for _, k := range KnownPrefixes {
		if prefix == k {
			known = true
		}
	}
	if !known {
		return "", "", fmt.Errorf("unknown [os:] prefix %q", prefix)
	}
	return prefix, rest, nil
}

func osKey(goos string) (string, error) {
	if goos == "" {
		goos = runtime.GOOS
	}
	switch goos {
	case "linux":
		return "linux", nil
	case "darwin":
		return "macos", nil
	case "windows":
		return "windows", nil
	default:
		return "", fmt.Errorf("unsupported OS %q", goos)
	}
}

// HookApplies reports whether a hook alias entry with the given "[os:]" prefix
// ("" for bare entries) runs on the current OS.
func HookApplies(prefix string) (bool, error) {
	if prefix == "" || prefix == "[any:]" {
		return true, nil
	}
	key := strings.Trim(prefix, "[]:")
	if !project.OSKeys[key] {
		return false, fmt.Errorf("unknown [os:] prefix %q", prefix)
	}
	cur, err := osKey("")
	if err != nil {
		return false, err
	}
	return key == cur, nil
}

// Select returns the runnable lines for an alias: [any] lines first, then the
// matching-OS lines. Unknown os keys are hard errors; zero selected lines is a
// hard error naming alias+OS.
func Select(cmds project.OSCommands, alias, goos string) ([]string, error) {
	for k := range cmds {
		if !project.OSKeys[k] {
			return nil, fmt.Errorf("alias %q: unknown os key %q (want any|linux|windows|macos)", alias, k)
		}
	}
	key, err := osKey(goos)
	if err != nil {
		return nil, fmt.Errorf("alias %q: %w", alias, err)
	}
	out := append([]string{}, cmds["any"]...)
	out = append(out, cmds[key]...)
	if len(out) == 0 {
		return nil, fmt.Errorf("alias %q selects zero lines for %s", alias, key)
	}
	return out, nil
}

func shellForOS() (string, string) {
	if runtime.GOOS == "windows" {
		return "cmd", "/C"
	}
	return "bash", "-c"
}

// RunLines executes pre-selected lines in order with <root> cwd, fail-fast.
func RunLines(root string, lines []string, extraArgs string) error {
	if len(lines) == 0 {
		return fmt.Errorf("zero selected lines for current OS")
	}
	shell, flag := shellForOS()
	for _, body := range lines {
		line := body
		if extraArgs != "" {
			line = line + " " + extraArgs
		}
		cmd := exec.Command(shell, flag, line)
		cmd.Dir = root
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("command %q failed: %w", body, err)
		}
	}
	return nil
}

package scripts

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

var KnownPrefixes = []string{"[linux:]", "[windows:]", "[macos:]", "[any:]"}

var HookStandards = map[string]bool{
	"build": true,
	"check": true,
}

func osToken() string {
	switch runtime.GOOS {
	case "linux":
		return "[linux:]"
	case "darwin":
		return "[macos:]"
	case "windows":
		return "[windows:]"
	default:
		return "[any:]"
	}
}

func stripPrefix(line string) (prefix, body string, err error) {
	if !strings.HasPrefix(line, "[") {
		return "", line, nil
	}
	end := strings.Index(line, "]")
	if end < 0 {
		return "", "", fmt.Errorf("malformed [os:] prefix in %q", line)
	}
	prefix = line[:end+1]
	body = strings.TrimSpace(line[end+1:])
	known := prefix == "[any:]"
	for _, k := range KnownPrefixes {
		if prefix == k {
			known = true
		}
	}
	if !known {
		return "", "", fmt.Errorf("unknown [os:] prefix %q", prefix)
	}
	return prefix, body, nil
}

func Select(lines []string, goos string) ([]string, error) {
	tok := osToken()
	_ = goos
	var out []string
	for _, l := range lines {
		prefix, body, err := stripPrefix(l)
		if err != nil {
			return nil, err
		}
		if prefix == "" || prefix == "[any:]" || prefix == tok {
			out = append(out, body)
		}
	}
	return out, nil
}

func shellForOS() (string, string) {
	if runtime.GOOS == "windows" {
		return "cmd", "/C"
	}
	return "bash", "-c"
}

func RunLines(root string, lines []string, extraArgs string) error {
	selected, err := Select(lines, runtime.GOOS)
	if err != nil {
		return err
	}
	if len(selected) == 0 {
		return fmt.Errorf("zero selected lines for current OS")
	}
	shell, flag := shellForOS()
	for _, body := range selected {
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

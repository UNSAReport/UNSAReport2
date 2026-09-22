package scripts

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"

	"github.com/UNSAReport/tui/internal/project"
)

var HookStandards = project.HookStandards

func SplitPrefix(entry string) (osKey, rest string, err error) {
	trimmed := strings.TrimSpace(entry)
	if strings.HasPrefix(trimmed, "[") {
		return "", "", fmt.Errorf("malformed os prefix in %q (want \"os:<any|linux|windows|macos> <alias>\")", entry)
	}
	if !strings.HasPrefix(trimmed, "os:") {
		return "", trimmed, nil
	}
	key, after, found := strings.Cut(trimmed[len("os:"):], " ")
	if !found {
		return "", trimmed, nil
	}
	if !project.OSKeys[key] {
		return "", "", fmt.Errorf("unknown os prefix %q (want any|linux|windows|macos)", trimmed)
	}
	return key, strings.TrimSpace(after), nil
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

func HookApplies(key string) (bool, error) {
	if key == "" || key == "any" {
		return true, nil
	}
	if !project.OSKeys[key] {
		return false, fmt.Errorf("unknown os prefix %q", key)
	}
	cur, err := osKey("")
	if err != nil {
		return false, err
	}
	return key == cur, nil
}

func Select(cmds project.ScriptCommands, alias, goos string) (string, error) {
	for k := range cmds {
		if !project.OSKeys[k] {
			return "", fmt.Errorf("alias %q: unknown os key %q (want any|linux|windows|macos)", alias, k)
		}
	}
	key, err := osKey(goos)
	if err != nil {
		return "", fmt.Errorf("alias %q: %w", alias, err)
	}
	var parts []string
	if c := strings.TrimSpace(cmds["any"]); c != "" {
		parts = append(parts, c)
	}
	if c := strings.TrimSpace(cmds[key]); c != "" {
		parts = append(parts, c)
	}
	if len(parts) == 0 {
		return "", fmt.Errorf("alias %q selects no command for %s", alias, key)
	}
	return strings.Join(parts, "\n"), nil
}

func shellForOS() (string, string) {
	if runtime.GOOS == "windows" {
		return "cmd", "/C"
	}
	return "bash", "-c"
}

func RunScript(root, script, extraArgs string, extraEnv []string) error {
	var lines []string
	for _, body := range strings.Split(script, "\n") {
		if strings.TrimSpace(body) != "" {
			lines = append(lines, body)
		}
	}
	if len(lines) == 0 {
		return fmt.Errorf("no command to run for current OS")
	}
	shell, flag := shellForOS()
	for _, body := range lines {
		line := body
		if extraArgs != "" {
			line = line + " " + extraArgs
		}
		cmd := exec.Command(shell, flag, line)
		cmd.Dir = root
		if len(extraEnv) > 0 {
			cmd.Env = append(os.Environ(), extraEnv...)
		}
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("command %q failed: %w", body, err)
		}
	}
	return nil
}

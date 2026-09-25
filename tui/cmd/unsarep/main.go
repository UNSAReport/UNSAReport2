package main

import (
	"errors"
	"fmt"
	"os"
)

func main() {
	root := newRootCmd()
	if err := root.Execute(); err != nil {
		var ue *usageError
		if errors.As(err, &ue) {
			fmt.Fprintf(os.Stderr, "Error: %v\n\n", ue.err)
			if ue.cmd != nil {
				_ = ue.cmd.Help()
			}
			os.Exit(2)
		}
		renderError(err)
		os.Exit(1)
	}
}

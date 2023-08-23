// Package cli contains functions for building CLIs.
package cli

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"os"
	"sort"
	"strings"
	"sync"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
)

// BuildDate is the application build date in YYYY-MM-DD, set with candid/lib/cli.Builddate build time variable.
var BuildDate string //nolint:gochecknoglobals

// BuildVersion is the application version, set with candid/lib/cli.BuildVersion build time variable.
var BuildVersion string //nolint:gochecknoglobals

// Config manages the CLI configuration.
type Config struct {
	Debug         bool `json:"debug"`
	NoColor       bool `json:"noColor"`
	OutputJSON    bool `json:"outputJSON"`
	runMock       runMock
	runMockEnable bool
}

type runMock struct {
	inputs  []RunMockInput
	errs    []error
	mutex   *sync.Mutex
	outputs []string
}

// Command is a positional command to run.
type Command[T AppConfig[any]] struct {
	/* Optional Positional arguments after command */
	ArgumentsOptional []string

	/* Positional arguments required after command */
	ArgumentsRequired []string

	/* Override the command name in usage */
	Name string

	/* Function to run when calling the command */
	Run func(ctx context.Context, args []string, config T) errs.Err

	/* Usage information, omitting this hides the command */
	Usage string
}

var ErrUnknownCommand = errs.NewCLIErr(errors.New("unknown command"))

// App is a CLI application.
type App[T AppConfig[any]] struct {
	Commands         map[string]Command[T]
	Config           T
	Description      string
	HideConfigFields []string
	Name             string
	NoParse          bool
}

// AppConfig is a configuration that can be used with CLI.
type AppConfig[T any] interface {
	CLIConfig() *Config
	Parse(ctx context.Context, configArgs, paths string) errs.Err
}

// Run is the main entrypoint into a CLI app.
func (a App[T]) Run() errs.Err { //nolint:gocognit
	ctx := context.Background()

	flag.Usage = func() {
		//nolint: forbidigo
		fmt.Printf(`Usage: %s [flags] [command]

%s

Commands:
`, a.Name, a.Description)

		c := []string{}

		for i := range a.Commands {
			if a.Commands[i].Usage != "" {
				c = append(c, i)
			}
		}

		sort.Strings(c)

		for i := range c {
			name := c[i]
			if (a.Commands[c[i]]).Name != "" {
				name = a.Commands[c[i]].Name
			}

			for _, arg := range a.Commands[c[i]].ArgumentsRequired {
				name += fmt.Sprintf(" [%s]", arg)
			}

			for _, arg := range a.Commands[c[i]].ArgumentsOptional {
				name += fmt.Sprintf(" [%s, optional]", arg)
			}

			fmt.Printf("  %s\n    	%s\n", name, a.Commands[c[i]].Usage) //nolint:forbidigo
		}

		//nolint: forbidigo
		fmt.Print("\nFlags:\n")

		flag.CommandLine.SetOutput(os.Stdout)
		flag.PrintDefaults()
	}

	var paths string

	configArgs := ""

	if !a.NoParse {
		flag.StringVar(&paths, "c", "", "Path to JSON/YAML configuration files separated by a comma")

		a.Commands["show-config"] = Command[T]{
			Run: func(ctx context.Context, args []string, config T) errs.Err {
				return printConfig(ctx, a)
			},
			Usage: "Print the current configuration",
		}

		flag.StringVar(&configArgs, "x", configArgs, "Comma separated list of config key=value pairs")
	}

	a.Commands["version"] = Command[T]{
		Run: func(ctx context.Context, args []string, config T) errs.Err {
			fmt.Printf("Build Version: %s\n", BuildVersion) //nolint: forbidigo
			fmt.Printf("Build Date: %s\n", BuildDate)       //nolint: forbidigo

			return nil
		},
		Usage: "Print version information",
	}

	flag.BoolVar(&a.Config.CLIConfig().Debug, "d", a.Config.CLIConfig().Debug, "Enable debug logging")
	flag.BoolVar(&a.Config.CLIConfig().OutputJSON, "j", a.Config.CLIConfig().OutputJSON, "Output JSON instead of YAML")
	flag.BoolVar(&a.Config.CLIConfig().NoColor, "n", a.Config.CLIConfig().NoColor, "Disable colored logging")

	flag.Parse()

	if !a.NoParse {
		if err := a.Config.Parse(ctx, configArgs, paths); err != nil {
			return err
		}
	}

	ctx = logger.SetDebug(ctx, a.Config.CLIConfig().Debug)

	if a.Config.CLIConfig().NoColor {
		logger.NoColor()
	}

	args := flag.Args()
	if len(args) < 1 {
		flag.Usage()

		return ErrUnknownCommand
	}

	for k, v := range a.Commands {
		if k == args[0] || strings.Split(v.Name, " ")[0] == args[0] {
			if len(v.ArgumentsRequired) != 0 && (len(args)-1) < len(v.ArgumentsRequired) {
				logger.LogError("missing arguments: [", strings.Join(v.ArgumentsRequired[0+len(args)-1:], "] ["), "]\n")

				flag.Usage()

				return ErrUnknownCommand
			}

			return v.Run(ctx, args, a.Config)
		}
	}

	flag.Usage()

	return ErrUnknownCommand
}

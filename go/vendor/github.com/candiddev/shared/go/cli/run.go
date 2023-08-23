package cli

import (
	"bytes"
	"context"
	"errors"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"sync"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

// ContainerRuntime is an enum for determining which runtime to use.
type ContainerRuntime string

// ContainerRuntime is an enum for determining which runtime to use.
const (
	ContainerRuntimeNone   ContainerRuntime = ""
	ContainerRuntimeDocker ContainerRuntime = "docker"
	ContainerRuntimePodman ContainerRuntime = "podman"
)

var ErrRun = errors.New("error running commands")

// CmdOutput is a string of the command exec output.
type CmdOutput string

func (c *CmdOutput) String() string {
	if *c != "" {
		return strings.TrimSpace(string(*c))
	}

	return ""
}

func getContainerRuntime() (ContainerRuntime, error) {
	_, err := exec.LookPath("podman")
	if err != nil {
		_, err := exec.LookPath("docker")
		if err != nil {
			return ContainerRuntimeNone, errors.New("no container runtime found")
		}

		return ContainerRuntimeDocker, nil
	}

	return ContainerRuntimePodman, nil
}

func (r *RunOpts) getCmd(ctx context.Context) (*exec.Cmd, errs.Err) {
	var args []string

	var cmd string

	if r.ContainerImage == "" {
		cmd = r.Command
		args = r.Args
	} else {
		cri, err := getContainerRuntime()
		if err != nil {
			return nil, errs.NewCLIErr(err)
		}

		if cri != "" {
			cmd = string(cri)
			args = []string{
				"run",
				"-i",
				"--rm",
				"--name",
				fmt.Sprintf("etcha_%s", types.RandString(10)),
			}

			if r.ContainerEntrypoint != "" {
				args = append(args, "--entrypoint", r.ContainerEntrypoint)
			}

			if r.ContainerPrivileged {
				args = append(args, "--privileged")
			}

			if r.ContainerUser != "" {
				args = append(args, "-u", r.ContainerUser)
			}

			for i := range r.ContainerVolumes {
				args = append(args, "-v", r.ContainerVolumes[i])
			}

			args = append(args, "-w", r.WorkDir)
			args = append(args, r.ContainerImage)

			if r.Command != "" {
				args = append(args, r.Command)
			}

			args = append(args, r.Args...)
		}
	}

	return exec.CommandContext(ctx, cmd, args...), nil
}

// RunOpts are options for running a CLI command.
type RunOpts struct {
	Args                []string
	Command             string
	ContainerEntrypoint string
	ContainerImage      string
	ContainerPrivileged bool
	ContainerUser       string
	ContainerVolumes    []string
	Environment         []string
	NoErrorLog          bool
	Stdin               string
	WorkDir             string
}

// Run uses RunOpts to run CLI commands.
func (c *Config) Run(ctx context.Context, opts RunOpts) (out CmdOutput, err errs.Err) {
	cmd, err := opts.getCmd(ctx)
	if err != nil {
		return "", logger.Log(ctx, errs.NewCLIErr(err))
	}

	cmd.Dir = opts.WorkDir

	if opts.Stdin != "" {
		b := bytes.NewBufferString(opts.Stdin)
		cmd.Stdin = b
	}

	if c.Debug {
		logger.LogDebug("Running commands:\n", cmd.String())
	}

	var e error

	var o []byte

	if c.runMockEnable {
		c.runMockLock()

		if len(c.runMock.errs) > 0 {
			e = c.runMock.errs[0]
		}

		if len(c.runMock.outputs) > 0 {
			o = []byte(c.runMock.outputs[0])
		}

		if len(c.runMock.errs) > 1 {
			c.runMock.errs = c.runMock.errs[1:]
		} else {
			c.runMock.errs = nil
		}

		c.runMock.inputs = append(c.runMock.inputs, RunMockInput{
			Environment: opts.Environment,
			Exec:        cmd.String(),
			WorkDir:     opts.WorkDir,
		})

		if len(c.runMock.outputs) > 1 {
			c.runMock.outputs = c.runMock.outputs[1:]
		}

		c.runMock.mutex.Unlock()
	} else {
		cmd.Env = os.Environ()
		cmd.Env = append(cmd.Env, opts.Environment...)
		o, e = cmd.CombinedOutput()
	}

	out = CmdOutput(o)

	if e != nil {
		err := errs.NewCLIErr(ErrRun, e)

		if !opts.NoErrorLog {
			logger.Log(ctx, err) //nolint:errcheck
			logger.LogError(out.String())
		}

		return CmdOutput(o), err
	}

	if c.Debug {
		logger.LogDebug(out.String())
	}

	return out, logger.Log(ctx, nil)
}

// RunMockInput is a log of things that were inputted into the RunMock.
type RunMockInput struct {
	Environment []string
	Exec        string
	WorkDir     string
}

// RunMock makes the CLI Run use a mock.
func (c *Config) RunMock(enable bool) {
	c.runMockEnable = enable
}

// RunMockErrors sets errors to respond to a CLI Run command.
func (c *Config) RunMockErrors(err []error) {
	c.runMockLock()
	c.runMock.errs = err
	c.runMock.mutex.Unlock()
}

// RunMockInputs returns a list of RunMockInputs.
func (c *Config) RunMockInputs() []RunMockInput {
	c.runMockLock()
	defer c.runMock.mutex.Unlock()

	i := c.runMock.inputs

	c.runMock.inputs = nil

	return i
}

// RunMockOutputs sets the outputs to respond to a CLI Run command.
func (c *Config) RunMockOutputs(outputs []string) {
	c.runMockLock()
	c.runMock.outputs = outputs
	c.runMock.mutex.Unlock()
}

func (c *Config) runMockLock() {
	if c.runMock.mutex == nil {
		c.runMock.mutex = &sync.Mutex{}
	}

	c.runMock.mutex.Lock()
}

// RunMain wraps a main function with args to parse the output.
func RunMain(main func(), stdin string, args ...string) string {
	os.Args = append([]string{""}, args...)

	SetStdin(stdin)
	logger.SetStd()

	flag.CommandLine = flag.NewFlagSet(os.Args[0], flag.ExitOnError)

	main()

	return logger.ReadStd()
}

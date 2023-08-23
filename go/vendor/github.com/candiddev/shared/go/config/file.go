package config

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/get"
	"github.com/candiddev/shared/go/logger"
)

// PathText contains the contents for paths.
type PathText struct {
	Path string
	Text string
}

// PathTexts are multiple PathText.
type PathTexts []PathText

var ErrUpdateFile = errors.New("error updating from file")

func getTemplateFiles(ctx context.Context, input, filePath string) (output string, err errs.Err) { //nolint:gocognit
	tmpls := []string{}
	output = input

	for {
		s := regexp.MustCompile(`template_file "(\S+)"`).FindAllStringSubmatch(output, -1)
		if len(s) == 0 {
			break
		}

		output = strings.ReplaceAll(output, "template_file", "template")

		for i := range s {
			if s[i][1] != "" {
				match := false

				p := s[i][1]
				if !strings.HasPrefix(p, "/") {
					p = filepath.Dir(filePath) + "/" + p
				}

				for j := range tmpls {
					if tmpls[j] == p {
						match = true

						break
					}
				}

				if !match {
					b := &bytes.Buffer{}

					if _, e := get.File(ctx, p, b, time.Time{}); e != nil {
						return "", logger.Log(ctx, errs.NewCLIErr(fmt.Errorf("error getting file in %s", filePath), e))
					}

					out := b.String()

					sp := regexp.MustCompile(`template_file "(\S+)"`).FindAllStringSubmatch(out, -1)
					for i := range sp {
						if sp[i][1] != "" && !strings.HasPrefix(sp[i][1], "/") {
							out = strings.ReplaceAll(out, sp[i][1], filepath.Dir(s[i][1])+"/"+sp[i][1])
						}
					}

					tmpls = append(tmpls, p)

					output = fmt.Sprintf(`{{- define "%s" }}
%s
{{- end -}}`, s[i][1], out) + "\n" + output
				}
			}
		}
	}

	return output, nil
}

// GetPathsText collects PathTexts for paths having an optional extension.  If path is "-", will read from stdin.
func GetPathsText(ctx context.Context, noDir bool, extension, paths string) (PathTexts, errs.Err) { //nolint:gocognit
	text := PathTexts{}

	if paths == "-" {
		var stdin string

		b, e := io.ReadAll(os.Stdin)
		if e == nil {
			stdin = string(b)
		}

		return PathTexts{
			{
				Path: "-",
				Text: strings.TrimSpace(stdin),
			},
		}, nil
	}

	for _, s := range strings.Split(paths, ",") {
		if s == "" {
			continue
		}

		f, err := os.Open(s)
		if err != nil {
			return nil, logger.Log(ctx, errs.NewCLIErr(ErrUpdateFile, err))
		}

		info, err := f.Stat()
		if err != nil {
			return nil, logger.Log(ctx, errs.NewCLIErr(ErrUpdateFile, err))
		}

		if info.IsDir() {
			if noDir {
				return nil, logger.Log(ctx, errs.NewCLIErr(ErrUpdateFile, errors.New("path is a directory")))
			}

			if err := filepath.WalkDir(s, func(path string, d fs.DirEntry, err error) error {
				if err == nil && !d.Type().IsDir() {
					if extension != "" && filepath.Ext(path) != "."+extension {
						return nil
					}

					contents, err := os.ReadFile(path)
					if err != nil {
						return logger.Log(ctx, errs.NewCLIErr(ErrUpdateFile, err))
					}

					output, e := getTemplateFiles(ctx, string(contents), path)
					if err != nil {
						return logger.Log(ctx, e)
					}

					text = append(text, PathText{
						Path: path,
						Text: output,
					})
				}

				return err
			}); err != nil {
				return nil, logger.Log(ctx, errs.NewCLIErr(ErrUpdateFile, err))
			}
		} else {
			if extension != "" && filepath.Ext(s) != "."+extension {
				return nil, logger.Log(ctx, nil)
			}

			contents, err := os.ReadFile(s)
			if err != nil {
				return nil, logger.Log(ctx, errs.NewCLIErr(ErrUpdateFile, err))
			}

			output, e := getTemplateFiles(ctx, string(contents), s)
			if err != nil {
				return nil, logger.Log(ctx, e)
			}

			text = append(text, PathText{
				Path: s,
				Text: output,
			})
		}
	}

	return text, nil
}

// Concat combines the text from all paths.
func (p PathTexts) Concat() string {
	out := ""

	for i := range p {
		out += p[i].Text
	}

	return out
}

func getRenderFiles(ctx context.Context, config any, extension, paths string) errs.Err {
	text, err := GetPathsText(ctx, false, extension, paths)
	if err != nil {
		return logger.Log(ctx, err)
	}

	for i := range text {
		if err := Render(ctx, config, config, text[i].Text); err != nil {
			return logger.Log(ctx, err)
		}
	}

	return nil
}

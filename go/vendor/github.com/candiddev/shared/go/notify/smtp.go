package notify

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"net"
	"net/smtp"
	"regexp"
	"strconv"
	"strings"
	"text/template"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/metrics"
	"github.com/gomarkdown/markdown"
)

// SMTP is a Notifier for sending emails.
type SMTP struct {
	Port           int      `json:"port"`
	FromAddress    string   `json:"fromAddress"`
	Hostname       string   `json:"hostname"`
	NoEmailDomains []string `json:"noEmailDomains"`
	Password       string   `json:"password"`
	ReplyTo        string   `json:"replyTo"`
	Username       string   `json:"username"`

	invalidDomain *regexp.Regexp
	smtpTemplate  *template.Template
}

// SMTPMessage contains details for sending SMTP.
type SMTPMessage struct {
	// Body is the main body of the message.
	Body string

	// FooterFrom is a translated sentence describing who sent the email.
	FooterFrom string

	// FooterUpdated is a translated sentence describing how to update email preferences.
	FooterUpdate string

	// Subject of the message.
	Subject string

	// To is the address to send the message to.
	To string
}

var ErrSMTPInit = errors.New("Error initializing SMTP")

// Setup sets up the SMTP template.
func (s *SMTP) Setup(ctx context.Context, appName, baseURL, logoURL, unsubscribePath string) errs.Err {
	s.invalidDomain = regexp.MustCompile(fmt.Sprintf("(%s)", strings.Join(append(s.NoEmailDomains, "example.com"), "|")))

	if s.FromAddress == "" {
		return logger.Log(ctx, errs.NewServerErr(ErrSMTPInit, errors.New("missing FromAddress")))
	}

	s.smtpTemplate = template.New("message").Funcs(template.FuncMap{
		"AppName": func() string {
			return appName
		},
		"BaseURL": func() string {
			return baseURL
		},
		"FromAddress": func() string {
			return s.FromAddress
		},
		"LogoURL": func() string {
			return logoURL
		},
		"ReplyTo": func() string {
			return s.ReplyTo
		},
		"UnsubscribePath": func() string {
			return unsubscribePath
		},
	})

	return nil
}

// Send takes in a message and sends an email.  Returns an error if send is cancelled due to invalid parameters.
func (s *SMTP) Send(ctx context.Context, msg SMTPMessage) errs.Err {
	var i smtp.Auth

	ctx = logger.Trace(ctx)

	from := s.Username

	if s.smtpTemplate == nil {
		metrics.Notifications.WithLabelValues("smtp", "cancelled").Add(1)

		return logger.Log(ctx, NewErrCancelled("no SMTP template configured"))
	}

	if s.Hostname == "" {
		metrics.Notifications.WithLabelValues("smtp", "cancelled").Add(1)

		return logger.Log(ctx, NewErrCancelled("no SMTP hostname"))
	}

	if !s.ValidDomain(msg.To) {
		metrics.Notifications.WithLabelValues("smtp", "cancelled").Add(1)

		return logger.Log(ctx, NewErrCancelled("no valid recipients"))
	}

	if s.Username != "" {
		i = smtp.PlainAuth("", s.Username, s.Password, s.Hostname)
	}

	b, err := s.generateBody(msg)
	if err != nil {
		return logger.Log(ctx, errs.NewServerErr(ErrSend, err))
	}

	if err := smtp.SendMail(net.JoinHostPort(s.Hostname, strconv.Itoa(s.Port)), i, from, []string{msg.To}, b); err != nil {
		metrics.Notifications.WithLabelValues("smtp", "failure").Add(1)

		return logger.Log(ctx, errs.NewServerErr(ErrSend, err))
	}

	metrics.Notifications.WithLabelValues("smtp", "success").Add(1)

	return logger.Log(ctx, nil, msg.To)
}

// ValidDomain checks an email address to see if it's from a domain that should be ignored.
func (s *SMTP) ValidDomain(email string) bool {
	emailParts := strings.Split(strings.ToLower(email), "@")
	if s.invalidDomain == nil || len(emailParts) != 2 {
		return false
	}

	return len(s.NoEmailDomains) == 0 || !s.invalidDomain.MatchString(emailParts[1])
}

func (s *SMTP) generateBody(m SMTPMessage) ([]byte, error) {
	m.Body = string(markdown.ToHTML([]byte(m.Body), nil, nil))

	var t bytes.Buffer

	err := template.Must(s.smtpTemplate.Funcs(template.FuncMap{
		"FooterFrom": func() string {
			return m.FooterFrom
		},
		"FooterUpdate": func() string {
			return m.FooterUpdate
		},
	}).Funcs(template.FuncMap{
		"replace": func(regExp, replace, str string) string {
			return regexp.MustCompile(regExp).ReplaceAllString(str, replace)
		},
	}).Parse(smtpTemplate)).Execute(&t, m)
	if err != nil {
		return nil, err
	}

	return t.Bytes(), nil
}

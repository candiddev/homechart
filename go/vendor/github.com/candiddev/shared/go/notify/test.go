package notify

import (
	"context"
	"sync"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
)

type test struct {
	err             errs.Err
	smtpMessages    []SMTPMessage
	webPushMessages []WebPushMessage
	mutex           *sync.Mutex
}

// Test holds mock variables.
var Test = test{ //nolint:gochecknoglobals
	mutex: &sync.Mutex{},
}

func (t *test) Error(err errs.Err) {
	t.mutex.Lock()
	defer t.mutex.Unlock()

	t.err = err
}

func (t *test) SMTPMessages() []SMTPMessage {
	t.mutex.Lock()
	defer t.mutex.Unlock()
	defer func() {
		t.smtpMessages = []SMTPMessage{}
	}()

	return t.smtpMessages
}

func (t *test) WebPushMessages() []WebPushMessage {
	t.mutex.Lock()
	defer t.mutex.Unlock()
	defer func() {
		t.webPushMessages = []WebPushMessage{}
	}()

	return t.webPushMessages
}

// SendSMTP mocks sending a SMTP message.
func (t *test) SendSMTP(ctx context.Context, msg SMTPMessage) errs.Err {
	t.mutex.Lock()
	t.smtpMessages = append(t.smtpMessages, msg)
	t.mutex.Unlock()

	return logger.Log(ctx, t.err)
}

// SendWebPush mocks sending a WebPush message.
func (t *test) SendWebPush(ctx context.Context, msg WebPushMessage) errs.Err {
	t.mutex.Lock()
	t.webPushMessages = append(t.webPushMessages, msg)
	t.mutex.Unlock()

	return logger.Log(ctx, t.err)
}

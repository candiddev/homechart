package controllers

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/metrics"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

type sse struct {
	ClientAdd    chan sseClient
	ClientRemove chan sseClient
	ClientsMux   sync.Mutex
	Clients      []sseClient
}

type sseClient struct {
	ID               uuid.UUID
	AuthAccountID    uuid.UUID
	AuthHouseholdIDs types.UUIDs
	Closer           chan bool
	Receiver         chan string
}

func newSSE() *sse {
	return &sse{
		ClientAdd:    make(chan sseClient),
		ClientRemove: make(chan sseClient),
		Clients:      []sseClient{},
	}
}

func (s *sse) sendKeepalives() {
	s.ClientsMux.Lock()
	for _, client := range s.Clients {
		client.Receiver <- ""
	}
	s.ClientsMux.Unlock()
}

func (s *sse) handleClientAdd(c sseClient) {
	s.ClientsMux.Lock()
	defer s.ClientsMux.Unlock()

	s.Clients = append(s.Clients, c)

	metrics.ControllerSSEClients.WithLabelValues().Add(1)
}

func (s *sse) handleClientRemove(c sseClient) {
	s.ClientsMux.Lock()
	defer s.ClientsMux.Unlock()

	c.Closer <- false

	for i, client := range s.Clients {
		if client.ID == c.ID {
			if len(s.Clients) == 1 {
				s.Clients = []sseClient{}

				metrics.ControllerSSEClients.WithLabelValues().Set(0)

				return
			}

			s.Clients[i] = s.Clients[len(s.Clients)-1]
			s.Clients[len(s.Clients)-1] = sseClient{}
			s.Clients = s.Clients[:len(s.Clients)-1]

			metrics.ControllerSSEClients.WithLabelValues().Set(float64(len(s.Clients)))
		}
	}
}

func (s *sse) handleReceiver(_ context.Context, n *types.TableNotify) { //nolint:gocognit
	// For global objects, like PlanTask templates
	if n.AuthAccountID == nil && n.AuthHouseholdID == nil {
		s.ClientsMux.Lock()
		for i := range s.Clients {
			s.Clients[i].Receiver <- n.String()
		}
		s.ClientsMux.Unlock()

		return
	}

	if n.AuthAccountID != nil {
		s.ClientsMux.Lock()
		for _, client := range s.Clients {
			if client.AuthAccountID == *n.AuthAccountID {
				client.Receiver <- n.String()
			}
		}
		s.ClientsMux.Unlock()
	}

	if n.AuthHouseholdID != nil {
		s.ClientsMux.Lock()
		for i := range s.Clients {
			for j := range s.Clients[i].AuthHouseholdIDs {
				if s.Clients[i].AuthHouseholdIDs[j] == *n.AuthHouseholdID && (n.AuthAccountID == nil || s.Clients[i].AuthAccountID != *n.AuthAccountID) { // Don't send the same message that was sent above
					if n.Table == "auth_account" {
						n.Table = "auth_household" // An AuthAccount was updated, but this is telling household members
					}
					s.Clients[i].Receiver <- n.String()
				}
			}
		}
		s.ClientsMux.Unlock()
	}
}

func (s *sse) Listen(ctx context.Context, db models.DB) {
	logger.Log(ctx, nil, "SSE listener started") //nolint:errcheck

	receiver := make(chan *types.TableNotify)

	go db.Listen(ctx, s.handleReceiver)

	sseKeepalive := time.NewTicker(time.Minute)
	defer sseKeepalive.Stop()

	for {
		select {
		case <-sseKeepalive.C:
			go s.sendKeepalives()
		case a := <-s.ClientAdd:
			go s.handleClientAdd(a)
		case a := <-s.ClientRemove:
			go s.handleClientRemove(a)
		case n := <-receiver:
			go s.handleReceiver(ctx, n)
		case <-ctx.Done():
			close(s.ClientAdd)
			close(s.ClientRemove)
			close(receiver)

			logger.Log(ctx, nil, "SSE listener stopped") //nolint:errcheck

			return
		}
	}
}

// SSERead registers a client to receive SSE notifications.
// @Accept json
// @ID SSERead
// @Param id path string true "AuthSessionID"
// @Produce text/event-stream
// @Router /sse/{id} [get]
// @Success 200 {object} Response{dataValue=types.TableNotify}
// @Summary SSE Listen
// @Tags SSE
func (h *Handler) SSERead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	a := models.AuthSession{
		ID: getUUID(r, "auth_session_id"),
	}

	if err := a.Read(ctx, true); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	// Check if client supports SSE/flushing
	flusher, ok := w.(http.Flusher)
	if !ok {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errClientBadRequestSSEUnsupported))

		return
	}

	// Set headers for event stream
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	closer := make(chan bool)
	receiver := make(chan string)

	client := sseClient{
		ID:               models.GenerateUUID(),
		AuthAccountID:    a.AuthAccountID,
		AuthHouseholdIDs: a.PermissionsHouseholds.GetIDs(),
		Receiver:         receiver,
		Closer:           closer,
	}

	h.SSE.ClientAdd <- client

	// Remove client if it disconnects
	go func() {
		<-r.Context().Done()
		h.SSE.ClientRemove <- client
	}()

	for {
		select {
		case <-closer:
			return
		case d := <-receiver:
			fmt.Fprintf(w, "id: %s\n\n", client.ID)
			fmt.Fprintf(w, "data: %s\n\n", d)

			flusher.Flush()
		}
	}
}

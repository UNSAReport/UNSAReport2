package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"

	"github.com/UNSAReport/tui/internal/config"
)

const callbackHTMLSuccess = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>UNSAReport CLI Authorization</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f8fafc;
      color: #0f172a;
    }
    .card {
      background: #ffffff;
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      text-align: center;
      max-width: 440px;
      border: 1px solid #e2e8f0;
    }
    h2 {
      margin-top: 0;
      color: #16a34a;
      font-size: 1.5rem;
    }
    p {
      color: #475569;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>✓ Authorization Successful</h2>
    <p>You can close this window and return to your terminal.</p>
  </div>
  <script>try { window.close(); } catch(e) {}</script>
</body>
</html>`

const callbackHTMLCancelled = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>UNSAReport CLI Authorization Cancelled</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f8fafc;
      color: #0f172a;
    }
    .card {
      background: #ffffff;
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      text-align: center;
      max-width: 440px;
      border: 1px solid #e2e8f0;
    }
    h2 {
      margin-top: 0;
      color: #dc2626;
      font-size: 1.5rem;
    }
    p {
      color: #475569;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>✕ Login Cancelled</h2>
    <p>You can close this window and return to your terminal.</p>
  </div>
  <script>try { window.close(); } catch(e) {}</script>
</body>
</html>`

type CallbackResult struct {
	PAT   string
	Token string
	Code  string
	State string
	Err   error
}

type CallbackServer struct {
	Listener net.Listener
	State    string
	Done     chan CallbackResult
	server   *http.Server
}

func GenerateState() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return "st_" + hex.EncodeToString(b), nil
}

func NewCallbackServer(state string) *CallbackServer {
	return &CallbackServer{State: state, Done: make(chan CallbackResult, 1)}
}

func (s *CallbackServer) Start() (string, error) {
	ln, err := net.Listen("tcp", config.DefaultCallbackHost)
	if err != nil {
		return "", err
	}
	s.Listener = ln
	mux := http.NewServeMux()
	mux.HandleFunc(config.CallbackPath, s.handleCallback)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == config.CallbackPath || r.URL.Path == config.CallbackPath+"/" {
			s.handleCallback(w, r)
			return
		}
		http.NotFound(w, r)
	})
	s.server = &http.Server{Handler: mux, ReadHeaderTimeout: config.CallbackReadHeaderTimeout}
	go func() { _ = s.server.Serve(ln) }()
	addr := ln.Addr().String()
	u := config.CallbackBaseURLPrefix + addr + config.CallbackPath
	return u, nil
}

func (s *CallbackServer) handleCallback(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "*")
	w.Header().Set("Access-Control-Allow-Private-Network", "true")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.URL.Path != config.CallbackPath && r.URL.Path != config.CallbackPath+"/" {
		http.NotFound(w, r)
		return
	}

	q := r.URL.Query()
	state := q.Get("state")
	if s.State != "" && state != s.State {
		http.Error(w, "invalid state", http.StatusBadRequest)
		select {
		case s.Done <- CallbackResult{Err: fmt.Errorf("invalid state: got %q want %q", state, s.State)}:
		default:
			fmt.Fprintf(os.Stderr, "callback channel full\n")
		}
		return
	}
	if errStr := q.Get("error"); errStr != "" {
		body := []byte(callbackHTMLCancelled)
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Content-Length", strconv.Itoa(len(body)))
		w.Header().Set("Connection", "close")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(body)
		if f, ok := w.(http.Flusher); ok {
			f.Flush()
		}
		select {
		case s.Done <- CallbackResult{Err: fmt.Errorf("login cancelled: %s", errStr), State: state}:
		default:
			fmt.Fprintf(os.Stderr, "callback channel full\n")
		}
		return
	}
	res := CallbackResult{
		PAT:   q.Get("pat"),
		State: state,
	}
	body := []byte(callbackHTMLSuccess)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Content-Length", strconv.Itoa(len(body)))
	w.Header().Set("Connection", "close")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(body)
	if f, ok := w.(http.Flusher); ok {
		f.Flush()
	}
	select {
	case s.Done <- res:
	default:
		fmt.Fprintf(os.Stderr, "callback channel full\n")
	}
}

func (s *CallbackServer) Close() {
	if s.server != nil {
		ctx, cancel := context.WithTimeout(context.Background(), config.CallbackShutdownTimeout)
		defer cancel()
		_ = s.server.Shutdown(ctx)
	}
	if s.Listener != nil {
		_ = s.Listener.Close()
	}
}

func (s *CallbackServer) Wait(timeout time.Duration) (CallbackResult, error) {
	select {
	case r := <-s.Done:
		return r, r.Err
	case <-time.After(timeout):
		return CallbackResult{}, fmt.Errorf("callback timeout after %s", timeout)
	}
}

func IsLoopbackURL(raw string) bool {
	u, err := url.Parse(raw)
	if err != nil {
		return false
	}
	if u.Scheme != "http" {
		return false
	}
	host := u.Hostname()
	return host == "127.0.0.1" || host == "localhost"
}

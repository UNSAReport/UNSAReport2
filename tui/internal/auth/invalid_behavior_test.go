package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/zalando/go-keyring"
)

func invalidClient(t *testing.T, h http.HandlerFunc) (*Client, *FileStore) {
	t.Helper()
	srv := httptest.NewServer(h)
	t.Cleanup(srv.Close)
	tmp := t.TempDir()
	t.Setenv("XDG_CONFIG_HOME", tmp)
	t.Setenv("UNSAREP_TOKEN", "")
	fs := &FileStore{Path: filepath.Join(tmp, "unsareport", "credentials.json")}
	c, err := NewClientWithConfig(ClientConfig{IDPIssuer: srv.URL, HTTPClient: srv.Client(), Store: fs})
	if err != nil {
		t.Fatal(err)
	}
	return c, fs
}

func TestInvalidMeServerError(t *testing.T) {
	c, _ := invalidClient(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(500)
		_, _ = w.Write([]byte("boom"))
	})
	if _, err := c.ValidateAndStore(context.Background(), "unsareport_pat_x"); err == nil || !strings.Contains(err.Error(), "500") {
		t.Fatalf("expected 500 error, got %v", err)
	}
}

func TestInvalidMeMalformed(t *testing.T) {
	c, _ := invalidClient(t, func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("not-json{{"))
	})
	if _, err := c.ValidateAndStore(context.Background(), "unsareport_pat_x"); err == nil || !strings.Contains(err.Error(), "unexpected whoami shape") {
		t.Fatalf("expected shape error, got %v", err)
	}
}

func TestInvalidMeMissingEmailAccepted(t *testing.T) {
	c, _ := invalidClient(t, func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"user": map[string]any{"id": "u9", "name": "NoMail"}})
	})
	cred, err := c.ValidateAndStore(context.Background(), "unsareport_pat_x")
	if err != nil {
		t.Fatal(err)
	}
	if cred.UserID != "u9" || cred.Email != "" {
		t.Fatalf("cred %+v", cred)
	}
}

func TestInvalidCallbackTimeout(t *testing.T) {
	cb := NewCallbackServer("st_wait")
	if _, err := cb.Start(); err != nil {
		t.Fatal(err)
	}
	defer cb.Close()
	if _, err := cb.Wait(20 * time.Millisecond); err == nil || !strings.Contains(err.Error(), "timeout") {
		t.Fatalf("expected timeout, got %v", err)
	}
}

func TestInvalidCallbackEmptyQuery(t *testing.T) {
	cb := NewCallbackServer("st_empty")
	url, err := cb.Start()
	if err != nil {
		t.Fatal(err)
	}
	defer cb.Close()
	resp, err := http.Get(url + "?foo=bar")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = resp.Body.Close() }()
	select {
	case r := <-cb.Done:
		if r.Err == nil || !strings.Contains(r.Err.Error(), "invalid state") {
			t.Fatalf("expected invalid-state result, got %+v", r)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("expected callback result for empty query")
	}
}

func TestInvalidCallbackDouble(t *testing.T) {
	cb := NewCallbackServer("st_double")
	url, err := cb.Start()
	if err != nil {
		t.Fatal(err)
	}
	defer cb.Close()
	get := func(pat string) {
		resp, err := http.Get(url + "?state=st_double&pat=" + pat)
		if err != nil {
			return
		}
		defer func() { _ = resp.Body.Close() }()
	}
	get("unsareport_pat_one")
	var first CallbackResult
	select {
	case first = <-cb.Done:
	case <-time.After(2 * time.Second):
		t.Fatal("expected first callback")
	}
	if first.PAT != "unsareport_pat_one" {
		t.Fatalf("first %+v", first)
	}
	get("unsareport_pat_two")
	select {
	case second := <-cb.Done:
		if second.PAT != "unsareport_pat_two" {
			t.Fatalf("second %+v", second)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("expected second callback while server still open")
	}
}

func TestInvalidCorruptCredentials(t *testing.T) {
	fs := &FileStore{Path: filepath.Join(t.TempDir(), "credentials.json")}
	if err := os.WriteFile(fs.Path, []byte("{bad json"), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := fs.Get(); err == nil || !strings.Contains(err.Error(), "corrupt") {
		t.Fatalf("expected corrupt error, got %v", err)
	}
}

func TestInvalidKeyringFailure(t *testing.T) {
	keyring.MockInit()
	if _, err := (&KeyringStore{}).Get(); err == nil {
		t.Fatal("expected keyring miss error on empty mock")
	}
	if err := (&KeyringStore{}).Set(nil); err == nil || !strings.Contains(err.Error(), "empty credentials") {
		t.Fatalf("expected empty-credentials error, got %v", err)
	}
}

func TestInvalidEmptyPAT(t *testing.T) {
	c, _ := invalidClient(t, func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("server must not be hit for empty token")
	})
	if _, err := c.ValidateAndStore(context.Background(), "   "); err == nil || !strings.Contains(err.Error(), "empty token") {
		t.Fatalf("expected empty-token error, got %v", err)
	}
	if err := (&FileStore{Path: filepath.Join(t.TempDir(), "c.json")}).Set(&Credentials{}); err == nil {
		t.Fatal("expected empty-credentials error")
	}
}

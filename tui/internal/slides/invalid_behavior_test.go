package slides

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestInvalidDeployClientReject(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(400)
		_ = json.NewEncoder(w).Encode(map[string]any{"error": "Bad", "message": "bad slug"})
	}))
	defer srv.Close()
	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	_, err := c.Deploy(context.Background(), "tok", &DeployRequest{Slug: "d", Title: "D"})
	if err == nil || !strings.Contains(err.Error(), "bad slug") || !strings.Contains(err.Error(), "400") {
		t.Fatalf("expected client-reject error, got %v", err)
	}
}

func TestInvalidDeployServerError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(500)
		_, _ = w.Write([]byte("oops"))
	}))
	defer srv.Close()
	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	_, err := c.Deploy(context.Background(), "tok", &DeployRequest{Slug: "d", Title: "D"})
	if err == nil || !strings.Contains(err.Error(), "500") {
		t.Fatalf("expected 500 error, got %v", err)
	}
}

func TestInvalidReachableUnauthorized(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(401)
		_ = json.NewEncoder(w).Encode(map[string]any{"error": "Unauthorized", "message": "nope"})
	}))
	defer srv.Close()
	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	err := c.Reachable(context.Background(), "tok")
	if err == nil || !strings.Contains(err.Error(), "401") || !strings.Contains(err.Error(), "nope") {
		t.Fatalf("expected 401 error, got %v", err)
	}
}

func TestInvalidDeployExtraField(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"success": true, "presentationId": "x", "slug": "d",
			"version": 1, "url": "u", "message": "ok", "extra": "ignored",
		})
	}))
	defer srv.Close()
	c := &Client{BaseURL: srv.URL, HTTPClient: srv.Client()}
	resp, err := c.Deploy(context.Background(), "tok", &DeployRequest{Slug: "d", Title: "D"})
	if err != nil {
		t.Fatal(err)
	}
	if !resp.Success || resp.Slug != "d" || resp.Version != 1 {
		t.Fatalf("resp %+v", resp)
	}
}

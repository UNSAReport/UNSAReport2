package auth

import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"
)

func TestCallbackStateValidation(t *testing.T) {
	state, err := GenerateState()
	if err != nil {
		t.Fatal(err)
	}
	if len(state) < 5 || state[:3] != "st_" {
		t.Fatalf("state %q", state)
	}
	cb := NewCallbackServer(state)
	url, err := cb.Start()
	if err != nil {
		t.Fatal(err)
	}
	defer cb.Close()
	if !IsLoopbackURL(url) {
		t.Fatalf("url not loopback %q", url)
	}
	go func() {
		_, _ = http.Get(url + "?state=bad&pat=unsareport_pat_test")
	}()
	select {
	case res := <-cb.Done:
		if res.Err == nil {
			t.Fatal("should error on bad state")
		}
	case <-time.After(2 * time.Second):
		t.Fatal("timeout")
	}

	cb2 := NewCallbackServer(state)
	url2, _ := cb2.Start()
	defer cb2.Close()
	go func() {
		_, _ = http.Get(url2 + "?state=" + state + "&pat=unsareport_pat_good")
	}()
	select {
	case res := <-cb2.Done:
		if res.Err != nil {
			t.Fatal(res.Err)
		}
		if res.PAT != "unsareport_pat_good" {
			t.Fatalf("pat %q", res.PAT)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("timeout valid")
	}
}

func TestIsLoopbackURL(t *testing.T) {
	if !IsLoopbackURL("http://127.0.0.1:1234/callback") {
		t.Fatal("should be loopback")
	}
	if !IsLoopbackURL("http://localhost:8080/callback") {
		t.Fatal("should be loopback localhost")
	}
	if IsLoopbackURL("https://127.0.0.1:1234/callback") {
		t.Fatal("https should not pass")
	}
	if IsLoopbackURL("http://example.com/callback") {
		t.Fatal("external should not pass")
	}
	if IsLoopbackURL("http://127.0.0.1.evil.com/callback") {
		t.Fatal("evil should not pass")
	}
}

func TestHeadlessDetection(t *testing.T) {
	t.Setenv("SSH_CONNECTION", "1")
	if !IsHeadless() {
		t.Fatal("should be headless with SSH_CONNECTION")
	}
	t.Setenv("SSH_CONNECTION", "")
}

func TestCallbackErrorHandling(t *testing.T) {
	state := "st_test_cancel"
	cb := NewCallbackServer(state)
	url, err := cb.Start()
	if err != nil {
		t.Fatal(err)
	}
	defer cb.Close()

	go func() {
		_, _ = http.Get(url + "?state=" + state + "&error=cancelled")
	}()

	select {
	case res := <-cb.Done:
		if res.Err == nil {
			t.Fatal("expected error on cancelled callback")
		}
		if res.Err.Error() != "login cancelled: cancelled" {
			t.Fatalf("unexpected error message: %v", res.Err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("timeout waiting for error callback")
	}
}

func TestCallbackServerBrowserRace(t *testing.T) {
	state := "st_race_test"
	cb := NewCallbackServer(state)
	url, err := cb.Start()
	if err != nil {
		t.Fatal(err)
	}

	done := make(chan error, 1)
	go func() {
		res, err := cb.Wait(2 * time.Second)
		if err != nil {
			done <- err
			return
		}
		if res.PAT != "test_pat" {
			done <- fmt.Errorf("wrong pat")
			return
		}
		cb.Close()
		done <- nil
	}()

	resp, err := http.Get(url + "?state=" + state + "&pat=test_pat")
	if err != nil {
		t.Fatalf("HTTP client failed: %v", err)
	}
	defer func() { _ = resp.Body.Close() }()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("failed reading body: %v", err)
	}
	if !strings.Contains(string(body), "You can close this window") {
		t.Fatalf("unexpected body: %s", string(body))
	}
	if err := <-done; err != nil {
		t.Fatal(err)
	}
}

func TestCallbackFaviconIgnored(t *testing.T) {
	state := "st_favicon_test"
	cb := NewCallbackServer(state)
	url, err := cb.Start()
	if err != nil {
		t.Fatal(err)
	}
	defer cb.Close()

	favResp, err := http.Get("http://" + cb.Listener.Addr().String() + "/favicon.ico")
	if err != nil {
		t.Fatal(err)
	}
	_ = favResp.Body.Close()
	if favResp.StatusCode != http.StatusNotFound {
		t.Fatalf("favicon status %d want 404", favResp.StatusCode)
	}

	select {
	case bad := <-cb.Done:
		t.Fatalf("Done channel poisoned by favicon: %+v", bad)
	default:
	}

	cbResp, err := http.Get(url + "?state=" + state + "&pat=unsareport_pat_legit")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = cbResp.Body.Close() }()
	if cbResp.StatusCode != http.StatusOK {
		t.Fatalf("legit callback status %d", cbResp.StatusCode)
	}

	select {
	case res := <-cb.Done:
		if res.Err != nil {
			t.Fatal(res.Err)
		}
		if res.PAT != "unsareport_pat_legit" {
			t.Fatalf("unexpected PAT: %s", res.PAT)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("timeout waiting for valid callback after favicon")
	}
}

func TestCallbackOptionsPreflight(t *testing.T) {
	state := "st_opt_test"
	cb := NewCallbackServer(state)
	url, err := cb.Start()
	if err != nil {
		t.Fatal(err)
	}
	defer cb.Close()

	req, err := http.NewRequest(http.MethodOptions, url, nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Access-Control-Request-Private-Network", "true")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("preflight status %d want 204", resp.StatusCode)
	}
	if pna := resp.Header.Get("Access-Control-Allow-Private-Network"); pna != "true" {
		t.Fatalf("PNA header %q want true", pna)
	}
}

package main

import (
	"barbearia-backend/internal/config"
	"barbearia-backend/internal/handlers"
	"barbearia-backend/internal/store"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

func TestBackendEndToEnd(t *testing.T) {
	_ = os.RemoveAll("data")
	defer os.RemoveAll("data")

	cfg := &config.Config{
		Port:           "8080",
		JWTSecret:      "test-secret-key-123456",
		AdminEmail:     "admin@barbearia.com",
		AdminPassword:  "admin123",
		AllowedOrigins: "http://localhost:3000",
	}

	st, err := store.NewStore(cfg)
	if err != nil {
		t.Fatalf("failed to create store: %v", err)
	}

	api := handlers.NewAPI(st, cfg)
	router := NewRouter(api, cfg)

	// 1. Health check
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 on /api/health, got %d", rec.Code)
	}

	// 2. Unauthorized check on protected route
	req = httptest.NewRequest(http.MethodGet, "/api/clients", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 on unauthenticated /api/clients, got %d", rec.Code)
	}

	// 3. Login with admin credentials
	loginBody := []byte(`{"email":"admin@barbearia.com","password":"admin123"}`)
	req = httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(loginBody))
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 on /api/auth/login, got %d: %s", rec.Code, rec.Body.String())
	}

	var loginResp struct {
		Success bool `json:"success"`
		Data    struct {
			Token string `json:"token"`
		} `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &loginResp); err != nil || !loginResp.Success || loginResp.Data.Token == "" {
		t.Fatalf("unexpected login response: %s", rec.Body.String())
	}
	token := loginResp.Data.Token

	// 4. List clients with Bearer token
	req = httptest.NewRequest(http.MethodGet, "/api/clients", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 on authenticated /api/clients, got %d", rec.Code)
	}

	// 5. Create new client
	newClientBody := []byte(`{"name":"Teste Barbearia Go","phone":"11912345678","email":"teste@go.dev"}`)
	req = httptest.NewRequest(http.MethodPost, "/api/clients", bytes.NewReader(newClientBody))
	req.Header.Set("Authorization", "Bearer "+token)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201 on create client, got %d: %s", rec.Code, rec.Body.String())
	}

	// 6. Get Dashboard stats
	req = httptest.NewRequest(http.MethodGet, "/api/dashboard/stats?period=month", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 on dashboard stats, got %d", rec.Code)
	}
}

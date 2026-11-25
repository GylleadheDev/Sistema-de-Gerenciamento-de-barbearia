package main

import (
	"barbearia-backend/internal/config"
	"barbearia-backend/internal/handlers"
	"barbearia-backend/internal/store"
	"fmt"
	"log"
	"net/http"
	"time"
)

func corsAndLogMiddleware(cfg *config.Config, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = cfg.AllowedOrigins
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("[GO-API] %s %s (%s)", r.Method, r.URL.Path, time.Since(start).Round(time.Microsecond))
	})
}

func NewRouter(api *handlers.API, cfg *config.Config) http.Handler {
	mux := http.NewServeMux()

	// Public & Health routes
	mux.HandleFunc("GET /api/health", api.HandleHealth)
	mux.HandleFunc("GET /api/test-db", api.HandleTestDB)
	mux.HandleFunc("GET /api/services", api.HandleServicesCatalog)

	// Authentication routes (Go Native JWT + Cookie Auth + BetterAuth compatibility aliases)
	mux.HandleFunc("POST /api/auth/login", api.HandleLogin)
	mux.HandleFunc("POST /api/auth/sign-in/email", api.HandleLogin)
	mux.HandleFunc("POST /api/auth/logout", api.HandleLogout)
	mux.HandleFunc("POST /api/auth/sign-out", api.HandleLogout)
	mux.HandleFunc("GET /api/auth/session", api.HandleGetSession)
	mux.HandleFunc("GET /api/auth/get-session", api.HandleGetSession)

	// Clients routes (Protected)
	mux.HandleFunc("GET /api/clients", api.RequireAuth(api.HandleListClients))
	mux.HandleFunc("POST /api/clients", api.RequireAuth(api.HandleCreateClient))
	mux.HandleFunc("GET /api/clients/{id}", api.RequireAuth(api.HandleGetClient))
	mux.HandleFunc("PUT /api/clients/{id}", api.RequireAuth(api.HandleUpdateClient))
	mux.HandleFunc("DELETE /api/clients/{id}", api.RequireAuth(api.HandleDeleteClient))

	// Appointments routes (Protected)
	mux.HandleFunc("GET /api/appointments", api.RequireAuth(api.HandleListAppointments))
	mux.HandleFunc("POST /api/appointments", api.RequireAuth(api.HandleCreateAppointment))
	mux.HandleFunc("GET /api/appointments/{id}", api.RequireAuth(api.HandleGetAppointment))
	mux.HandleFunc("PUT /api/appointments/{id}", api.RequireAuth(api.HandleUpdateAppointment))
	mux.HandleFunc("PATCH /api/appointments/{id}/status", api.RequireAuth(api.HandleUpdateAppointmentStatus))
	mux.HandleFunc("DELETE /api/appointments/{id}", api.RequireAuth(api.HandleDeleteAppointment))

	// Dashboard Analytics routes (Protected)
	mux.HandleFunc("GET /api/dashboard/stats", api.RequireAuth(api.HandleDashboardStats))

	return corsAndLogMiddleware(cfg, mux)
}

func main() {
	cfg := config.Load()

	st, err := store.NewStore(cfg)
	if err != nil {
		log.Fatalf("Falha ao inicializar store: %v", err)
	}

	api := handlers.NewAPI(st, cfg)
	router := NewRouter(api, cfg)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("🚀 BarberPro Go Backend API rodando em http://localhost%s", addr)

	srv := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Erro no servidor HTTP Go: %v", err)
	}
}

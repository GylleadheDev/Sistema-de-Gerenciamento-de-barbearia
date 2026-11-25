package config

import (
	"bufio"
	"os"
	"strings"
)

type Config struct {
	Port           string
	DatabaseURL    string
	JWTSecret      string
	AdminEmail     string
	AdminPassword  string
	AllowedOrigins string
}

func Load() *Config {
	// Attempt to load .env from current or parent directory
	loadEnvFile(".env")
	loadEnvFile("../.env")

	port := getEnv("GO_PORT", getEnv("PORT", "8080"))
	dbURL := getEnv("DATABASE_URL", "")
	jwtSecret := getEnv("BETTER_AUTH_SECRET", getEnv("JWT_SECRET", getEnv("NEXTAUTH_SECRET", "barbearia-super-secret-jwt-key-2026")))
	adminEmail := getEnv("ADMIN_EMAIL", "admin@barbearia.com")
	adminPass := getEnv("ADMIN_PASSWORD", "admin123")
	origins := getEnv("ALLOWED_ORIGINS", "http://localhost:3000")

	return &Config{
		Port:           port,
		DatabaseURL:    dbURL,
		JWTSecret:      jwtSecret,
		AdminEmail:     adminEmail,
		AdminPassword:  adminPass,
		AllowedOrigins: origins,
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && strings.TrimSpace(val) != "" {
		return strings.Trim(strings.TrimSpace(val), `"'`)
	}
	return fallback
}

func loadEnvFile(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
		if _, exists := os.LookupEnv(key); !exists {
			_ = os.Setenv(key, val)
		}
	}
}

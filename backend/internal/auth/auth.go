package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

type Claims struct {
	UserID string `json:"sub"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	Role   string `json:"role"`
	Exp    int64  `json:"exp"`
	Iat    int64  `json:"iat"`
}

// HashPassword hashes a plaintext password with a random salt using SHA-256 PBKDF-style iterations.
func HashPassword(password string) string {
	salt := make([]byte, 16)
	_, _ = rand.Read(salt)
	saltHex := hex.EncodeToString(salt)
	hash := deriveKey(password, saltHex)
	return fmt.Sprintf("sha256$%s$%s", saltHex, hash)
}

func VerifyPassword(password, stored string) bool {
	if strings.HasPrefix(stored, "sha256$") {
		parts := strings.Split(stored, "$")
		if len(parts) != 3 {
			return false
		}
		expected := deriveKey(password, parts[1])
		return hmac.Equal([]byte(expected), []byte(parts[2]))
	}
	// Fallback plain comparison if seeded directly
	return hmac.Equal([]byte(password), []byte(stored))
}

func deriveKey(password, salt string) string {
	h := sha256.New()
	data := []byte(salt + ":" + password)
	for i := 0; i < 10000; i++ {
		h.Reset()
		h.Write(data)
		data = h.Sum(nil)
	}
	return hex.EncodeToString(data)
}

func SignJWT(claims Claims, secret string) (string, error) {
	header := `{"alg":"HS256","typ":"JWT"}`
	headerB64 := base64.RawURLEncoding.EncodeToString([]byte(header))

	payloadBytes, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	payloadB64 := base64.RawURLEncoding.EncodeToString(payloadBytes)

	unsigned := headerB64 + "." + payloadB64
	sig := signHS256(unsigned, secret)
	return unsigned + "." + sig, nil
}

func VerifyJWT(token, secret string) (*Claims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, errors.New("formato de token inválido")
	}

	unsigned := parts[0] + "." + parts[1]
	expectedSig := signHS256(unsigned, secret)
	if !hmac.Equal([]byte(expectedSig), []byte(parts[2])) {
		return nil, errors.New("assinatura de token inválida")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, err
	}

	var claims Claims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, err
	}

	if time.Now().Unix() > claims.Exp {
		return nil, errors.New("sessão expirada")
	}

	return &claims, nil
}

func signHS256(unsigned, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(unsigned))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func GenerateID(prefix string) string {
	b := make([]byte, 12)
	_, _ = rand.Read(b)
	if prefix != "" {
		return fmt.Sprintf("%s_%s", prefix, hex.EncodeToString(b))
	}
	return hex.EncodeToString(b)
}

package handlers

import (
	"barbearia-backend/internal/auth"
	"barbearia-backend/internal/config"
	"barbearia-backend/internal/models"
	"barbearia-backend/internal/store"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

const SessionCookieName = "barbearia_session"

type API struct {
	Store  *store.Store
	Config *config.Config
}

func NewAPI(s *store.Store, cfg *config.Config) *API {
	return &API{
		Store:  s,
		Config: cfg,
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeSuccess(w http.ResponseWriter, status int, data any, message string) {
	resp := map[string]any{
		"success": true,
		"data":    data,
	}
	if message != "" {
		resp["message"] = message
	}
	writeJSON(w, status, resp)
}

func writeError(w http.ResponseWriter, status int, message, code string) {
	resp := map[string]any{
		"success":    false,
		"error":      message,
		"statusCode": status,
	}
	if code != "" {
		resp["code"] = code
	}
	writeJSON(w, status, resp)
}

func (a *API) extractClaims(r *http.Request) (*auth.Claims, error) {
	// 1. Check Authorization Bearer header
	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		token := strings.TrimPrefix(authHeader, "Bearer ")
		return auth.VerifyJWT(token, a.Config.JWTSecret)
	}

	// 2. Check session cookie
	cookie, err := r.Cookie(SessionCookieName)
	if err == nil && cookie.Value != "" {
		return auth.VerifyJWT(cookie.Value, a.Config.JWTSecret)
	}

	return nil, errors.New("não autenticado")
}

func (a *API) RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if _, err := a.extractClaims(r); err != nil {
			writeError(w, http.StatusUnauthorized, "Não autorizado", "UNAUTHORIZED")
			return
		}
		next(w, r)
	}
}

// --- Auth Handlers ---

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (a *API) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Formato de requisição inválido", "INVALID_JSON")
		return
	}

	email := strings.TrimSpace(req.Email)
	if email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "Email e senha são obrigatórios", "MISSING_CREDENTIALS")
		return
	}

	user, err := a.Store.Authenticate(email, req.Password)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Email ou senha inválidos", "INVALID_EMAIL_OR_PASSWORD")
		return
	}

	now := time.Now().UTC()
	exp := now.Add(30 * 24 * time.Hour)
	claims := auth.Claims{
		UserID: user.ID,
		Email:  user.Email,
		Name:   user.Name,
		Role:   string(user.Role),
		Iat:    now.Unix(),
		Exp:    exp.Unix(),
	}

	token, err := auth.SignJWT(claims, a.Config.JWTSecret)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Erro ao gerar sessão", "TOKEN_ERROR")
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    token,
		Path:     "/",
		Expires:  exp,
		MaxAge:   30 * 24 * 3600,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	writeSuccess(w, http.StatusOK, map[string]any{
		"token": token,
		"user":  user,
		"session": map[string]any{
			"token":     token,
			"expiresAt": exp.Format(time.RFC3339),
			"userId":    user.ID,
		},
	}, "Login realizado com sucesso")
}

func (a *API) HandleLogout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
	writeSuccess(w, http.StatusOK, map[string]any{"loggedOut": true}, "Sessão encerrada com sucesso")
}

func (a *API) HandleGetSession(w http.ResponseWriter, r *http.Request) {
	claims, err := a.extractClaims(r)
	if err != nil {
		writeSuccess(w, http.StatusOK, nil, "")
		return
	}

	user, err := a.Store.GetUserByID(claims.UserID)
	if err != nil {
		writeSuccess(w, http.StatusOK, nil, "")
		return
	}

	writeSuccess(w, http.StatusOK, map[string]any{
		"user": user,
		"session": map[string]any{
			"userId":    user.ID,
			"expiresAt": time.Unix(claims.Exp, 0).UTC().Format(time.RFC3339),
		},
	}, "")
}

// --- Clients Handlers ---

var phoneDigitsRegex = regexp.MustCompile(`^\d{10,11}$`)

func cleanPhone(phone string) string {
	var b strings.Builder
	for _, r := range phone {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func (a *API) HandleListClients(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 {
		limit = 20
	}
	search := q.Get("search")

	clients, pagination := a.Store.ListClients(search, page, limit)
	writeSuccess(w, http.StatusOK, map[string]any{
		"clients":    clients,
		"pagination": pagination,
	}, "")
}

type clientInput struct {
	Name  string  `json:"name"`
	Phone string  `json:"phone"`
	Email *string `json:"email"`
}

func (a *API) HandleCreateClient(w http.ResponseWriter, r *http.Request) {
	var req clientInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dados inválidos", "INVALID_JSON")
		return
	}

	name := strings.TrimSpace(req.Name)
	if len(name) < 2 || len(name) > 100 {
		writeError(w, http.StatusBadRequest, "Nome deve ter entre 2 e 100 caracteres", "VALIDATION_ERROR")
		return
	}

	phone := cleanPhone(req.Phone)
	if !phoneDigitsRegex.MatchString(phone) {
		writeError(w, http.StatusBadRequest, "Telefone inválido (informe DDD + número com 10 ou 11 dígitos)", "VALIDATION_ERROR")
		return
	}

	client, err := a.Store.CreateClient(name, phone, req.Email)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrClientPhoneExists):
			writeError(w, http.StatusConflict, "Já existe um cliente com este telefone", "CLIENT_EXISTS")
		case errors.Is(err, store.ErrClientEmailExists):
			writeError(w, http.StatusConflict, "Já existe um cliente com este email", "EMAIL_EXISTS")
		default:
			writeError(w, http.StatusInternalServerError, err.Error(), "INTERNAL_ERROR")
		}
		return
	}

	writeSuccess(w, http.StatusCreated, client, "Cliente criado com sucesso")
}

func (a *API) HandleGetClient(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	client, err := a.Store.GetClient(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "Cliente não encontrado", "CLIENT_NOT_FOUND")
		return
	}
	writeSuccess(w, http.StatusOK, client, "")
}

type updateClientInput struct {
	Name  *string `json:"name"`
	Phone *string `json:"phone"`
	Email *string `json:"email"`
}

func (a *API) HandleUpdateClient(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req updateClientInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dados inválidos", "INVALID_JSON")
		return
	}

	if req.Name != nil {
		trimmed := strings.TrimSpace(*req.Name)
		if len(trimmed) < 2 || len(trimmed) > 100 {
			writeError(w, http.StatusBadRequest, "Nome deve ter entre 2 e 100 caracteres", "VALIDATION_ERROR")
			return
		}
		req.Name = &trimmed
	}

	if req.Phone != nil {
		cleaned := cleanPhone(*req.Phone)
		if !phoneDigitsRegex.MatchString(cleaned) {
			writeError(w, http.StatusBadRequest, "Formato de telefone inválido", "VALIDATION_ERROR")
			return
		}
		req.Phone = &cleaned
	}

	client, err := a.Store.UpdateClient(id, req.Name, req.Phone, req.Email)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			writeError(w, http.StatusNotFound, "Cliente não encontrado", "CLIENT_NOT_FOUND")
		case errors.Is(err, store.ErrClientPhoneExists):
			writeError(w, http.StatusConflict, "Já existe um cliente com este telefone", "CLIENT_EXISTS")
		case errors.Is(err, store.ErrClientEmailExists):
			writeError(w, http.StatusConflict, "Já existe um cliente com este email", "EMAIL_EXISTS")
		default:
			writeError(w, http.StatusInternalServerError, err.Error(), "INTERNAL_ERROR")
		}
		return
	}

	writeSuccess(w, http.StatusOK, client, "Cliente atualizado com sucesso")
}

func (a *API) HandleDeleteClient(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	err := a.Store.DeleteClient(id)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			writeError(w, http.StatusNotFound, "Cliente não encontrado", "CLIENT_NOT_FOUND")
		case errors.Is(err, store.ErrClientHasPendingAppts):
			writeError(w, http.StatusConflict, "Não é possível excluir cliente com agendamentos pendentes", "CLIENT_HAS_PENDING_APPOINTMENTS")
		default:
			writeError(w, http.StatusInternalServerError, err.Error(), "INTERNAL_ERROR")
		}
		return
	}

	writeSuccess(w, http.StatusOK, nil, "Cliente excluído com sucesso")
}

// --- Appointments Handlers ---

func (a *API) HandleListAppointments(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 {
		limit = 50
	}

	status := strings.ToUpper(strings.TrimSpace(q.Get("status")))
	if status != "" && status != "PENDING" && status != "COMPLETED" && status != "CANCELLED" {
		writeError(w, http.StatusBadRequest, "Status de filtro inválido", "VALIDATION_ERROR")
		return
	}

	var startDate, endDate *time.Time
	if s := q.Get("startDate"); s != "" {
		if t, err := time.Parse(time.RFC3339, s); err == nil {
			startDate = &t
		}
	}
	if e := q.Get("endDate"); e != "" {
		if t, err := time.Parse(time.RFC3339, e); err == nil {
			endDate = &t
		}
	}

	appts, pagination := a.Store.ListAppointments(store.AppointmentQuery{
		Status:    status,
		StartDate: startDate,
		EndDate:   endDate,
		Search:    q.Get("search"),
		Page:      page,
		Limit:     limit,
	})

	writeSuccess(w, http.StatusOK, map[string]any{
		"appointments": appts,
		"pagination":   pagination,
		"filters": map[string]any{
			"status":    status,
			"startDate": q.Get("startDate"),
			"endDate":   q.Get("endDate"),
		},
	}, "")
}

type createAppointmentInput struct {
	ClientID string  `json:"clientId"`
	Service  string  `json:"service"`
	DateTime string  `json:"dateTime"`
	Notes    *string `json:"notes"`
}

func (a *API) HandleCreateAppointment(w http.ResponseWriter, r *http.Request) {
	var req createAppointmentInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dados inválidos", "INVALID_JSON")
		return
	}

	if strings.TrimSpace(req.ClientID) == "" {
		writeError(w, http.StatusBadRequest, "Cliente é obrigatório", "VALIDATION_ERROR")
		return
	}

	if !models.IsValidService(req.Service) {
		writeError(w, http.StatusBadRequest, "Serviço inválido", "INVALID_SERVICE")
		return
	}

	dt, err := time.Parse(time.RFC3339, req.DateTime)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Data e hora inválidas", "INVALID_DATETIME")
		return
	}

	localDT := dt.Local()
	hour := localDT.Hour()
	if hour < 8 || hour >= 20 {
		writeError(w, http.StatusBadRequest, "Agendamentos apenas entre 08h e 20h", "INVALID_BUSINESS_HOURS")
		return
	}
	if localDT.Weekday() == time.Sunday {
		writeError(w, http.StatusBadRequest, "Não atendemos aos domingos", "CLOSED_ON_SUNDAY")
		return
	}

	appt, conflictClient, err := a.Store.CreateAppointment(req.ClientID, req.Service, dt, req.Notes)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			writeError(w, http.StatusNotFound, "Cliente não encontrado", "CLIENT_NOT_FOUND")
		case errors.Is(err, store.ErrAppointmentConflict):
			writeError(w, http.StatusConflict, fmt.Sprintf("Já existe um agendamento próximo a este horário (%s)", conflictClient), "APPOINTMENT_CONFLICT")
		default:
			writeError(w, http.StatusInternalServerError, err.Error(), "INTERNAL_ERROR")
		}
		return
	}

	writeSuccess(w, http.StatusCreated, appt, "Agendamento criado com sucesso")
}

func (a *API) HandleGetAppointment(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	appt, err := a.Store.GetAppointment(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "Agendamento não encontrado", "APPOINTMENT_NOT_FOUND")
		return
	}
	writeSuccess(w, http.StatusOK, appt, "")
}

type updateAppointmentInput struct {
	Status   string  `json:"status"`
	Notes    *string `json:"notes"`
	Service  *string `json:"service"`
	DateTime *string `json:"dateTime"`
}

func (a *API) HandleUpdateAppointment(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req updateAppointmentInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dados inválidos", "INVALID_JSON")
		return
	}

	var status models.AppointmentStatus
	if req.Status != "" {
		s := models.AppointmentStatus(strings.ToUpper(req.Status))
		if s != models.StatusPending && s != models.StatusCompleted && s != models.StatusCancelled {
			writeError(w, http.StatusBadRequest, "Status inválido", "VALIDATION_ERROR")
			return
		}
		status = s
	}

	var parsedDT *time.Time
	if req.DateTime != nil && *req.DateTime != "" {
		dt, err := time.Parse(time.RFC3339, *req.DateTime)
		if err != nil {
			writeError(w, http.StatusBadRequest, "Data e hora inválidas", "INVALID_DATETIME")
			return
		}
		parsedDT = &dt
	}

	appt, err := a.Store.UpdateAppointment(id, status, req.Notes, req.Service, parsedDT)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "Agendamento não encontrado", "APPOINTMENT_NOT_FOUND")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error(), "INTERNAL_ERROR")
		return
	}

	writeSuccess(w, http.StatusOK, appt, "Agendamento atualizado com sucesso")
}

type updateStatusInput struct {
	Status string `json:"status"`
}

func (a *API) HandleUpdateAppointmentStatus(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req updateStatusInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dados inválidos", "INVALID_JSON")
		return
	}

	status := models.AppointmentStatus(strings.ToUpper(strings.TrimSpace(req.Status)))
	if status != models.StatusPending && status != models.StatusCompleted && status != models.StatusCancelled {
		writeError(w, http.StatusBadRequest, "Status inválido", "VALIDATION_ERROR")
		return
	}

	appt, err := a.Store.UpdateAppointment(id, status, nil, nil, nil)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "Agendamento não encontrado", "APPOINTMENT_NOT_FOUND")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error(), "INTERNAL_ERROR")
		return
	}

	messages := map[models.AppointmentStatus]string{
		models.StatusPending:   "Agendamento marcado como pendente",
		models.StatusCompleted: "Agendamento concluído com sucesso",
		models.StatusCancelled: "Agendamento cancelado",
	}

	writeSuccess(w, http.StatusOK, appt, messages[status])
}

func (a *API) HandleDeleteAppointment(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	err := a.Store.DeleteAppointment(id)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			writeError(w, http.StatusNotFound, "Agendamento não encontrado", "APPOINTMENT_NOT_FOUND")
		case errors.Is(err, store.ErrAppointmentCompleted):
			writeError(w, http.StatusConflict, "Não é possível excluir agendamento já concluído", "APPOINTMENT_COMPLETED")
		default:
			writeError(w, http.StatusInternalServerError, err.Error(), "INTERNAL_ERROR")
		}
		return
	}

	writeSuccess(w, http.StatusOK, nil, "Agendamento excluído com sucesso")
}

// --- Dashboard & System Handlers ---

func (a *API) HandleDashboardStats(w http.ResponseWriter, r *http.Request) {
	period := r.URL.Query().Get("period")
	stats := a.Store.GetDashboardStats(period)
	writeSuccess(w, http.StatusOK, stats, "")
}

func (a *API) HandleServicesCatalog(w http.ResponseWriter, r *http.Request) {
	type catalogItem struct {
		Name     string  `json:"name"`
		Price    float64 `json:"price"`
		Duration int     `json:"duration"`
	}
	var items []catalogItem
	for _, s := range models.ValidServices {
		items = append(items, catalogItem{
			Name:     s,
			Price:    models.ServicePrices[s],
			Duration: models.ServiceDurations[s],
		})
	}
	writeSuccess(w, http.StatusOK, items, "")
}

func (a *API) HandleTestDB(w http.ResponseWriter, r *http.Request) {
	writeSuccess(w, http.StatusOK, a.Store.GetDBStatus(), "")
}

func (a *API) HandleHealth(w http.ResponseWriter, r *http.Request) {
	writeSuccess(w, http.StatusOK, map[string]any{
		"status":    "healthy",
		"service":   "barbearia-go-api",
		"runtime":   "Go net/http",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}, "")
}

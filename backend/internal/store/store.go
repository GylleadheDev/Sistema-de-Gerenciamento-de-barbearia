package store

import (
	"barbearia-backend/internal/auth"
	"barbearia-backend/internal/config"
	"barbearia-backend/internal/models"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"
)

var (
	ErrNotFound              = errors.New("registro não encontrado")
	ErrClientPhoneExists     = errors.New("já existe um cliente com este telefone")
	ErrClientEmailExists     = errors.New("já existe um cliente com este email")
	ErrClientHasPendingAppts = errors.New("não é possível excluir cliente com agendamentos pendentes")
	ErrAppointmentConflict   = errors.New("conflito de horário")
	ErrAppointmentCompleted  = errors.New("não é possível excluir agendamento já concluído")
	ErrInvalidCredentials    = errors.New("email ou senha inválidos")
)

type dbState struct {
	Users        []models.User        `json:"users"`
	Passwords    map[string]string    `json:"passwords"`
	Clients      []models.Client      `json:"clients"`
	Appointments []models.Appointment `json:"appointments"`
}

type Store struct {
	mu       sync.RWMutex
	filePath string
	state    dbState
	cfg      *config.Config
}

func NewStore(cfg *config.Config) (*Store, error) {
	dataDir := cfg.DataDir
	if dataDir == "" {
		dataDir = "data"
	}
	_ = os.MkdirAll(dataDir, 0755)
	fp := filepath.Join(dataDir, "database.json")

	s := &Store{
		filePath: fp,
		cfg:      cfg,
		state: dbState{
			Passwords: make(map[string]string),
		},
	}

	if err := s.load(); err != nil {
		// Initialize and seed default database
		s.seed()
		_ = s.save()
	} else if len(s.state.Users) == 0 {
		s.seed()
		_ = s.save()
	}

	return s, nil
}

func (s *Store) load() error {
	data, err := os.ReadFile(s.filePath)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, &s.state)
}

func (s *Store) save() error {
	data, err := json.MarshalIndent(s.state, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.filePath, data, 0644)
}

func (s *Store) seed() {
	now := time.Now().UTC()
	adminID := "usr_admin_01"
	adminEmail := s.cfg.AdminEmail
	if adminEmail == "" {
		adminEmail = "admin@barbearia.com"
	}
	adminPass := s.cfg.AdminPassword
	if adminPass == "" {
		adminPass = "admin123"
	}

	s.state.Users = []models.User{
		{
			ID:            adminID,
			Name:          "Master Barber Admin",
			Email:         adminEmail,
			EmailVerified: true,
			Role:          models.RoleAdmin,
			CreatedAt:     now,
			UpdatedAt:     now,
		},
	}
	if s.state.Passwords == nil {
		s.state.Passwords = make(map[string]string)
	}
	s.state.Passwords[adminID] = auth.HashPassword(adminPass)

	strPtr := func(v string) *string { return &v }

	s.state.Clients = []models.Client{
		{
			ID:        "seed-client-01",
			Name:      "João Silva",
			Phone:     "11999887766",
			Email:     strPtr("joao@email.com"),
			CreatedAt: now.AddDate(0, -2, 0),
			UpdatedAt: now.AddDate(0, -2, 0),
		},
		{
			ID:        "seed-client-02",
			Name:      "Mateus Santos",
			Phone:     "11988776655",
			Email:     strPtr("mateus@email.com"),
			CreatedAt: now.AddDate(0, -2, 5),
			UpdatedAt: now.AddDate(0, -2, 5),
		},
		{
			ID:        "seed-client-03",
			Name:      "Pedro Oliveira",
			Phone:     "11977665544",
			Email:     strPtr("pedro@email.com"),
			CreatedAt: now.AddDate(0, -1, -10),
			UpdatedAt: now.AddDate(0, -1, -10),
		},
		{
			ID:        "seed-client-04",
			Name:      "Rafael Costa",
			Phone:     "11966554433",
			Email:     strPtr("rafael@email.com"),
			CreatedAt: now.AddDate(0, -1, 0),
			UpdatedAt: now.AddDate(0, -1, 0),
		},
		{
			ID:        "seed-client-05",
			Name:      "Carlos Ferreira",
			Phone:     "11955443322",
			Email:     strPtr("carlos.ferreira@email.com"),
			CreatedAt: now.AddDate(0, 0, -20),
			UpdatedAt: now.AddDate(0, 0, -20),
		},
		{
			ID:        "seed-client-06",
			Name:      "Lucas Mendes",
			Phone:     "11944332211",
			Email:     strPtr("lucas.mendes@email.com"),
			CreatedAt: now.AddDate(0, 0, -12),
			UpdatedAt: now.AddDate(0, 0, -12),
		},
	}

	// Build realistic upcoming and historical appointments relative to current date
	today9am := time.Date(now.Year(), now.Month(), now.Day(), 10, 0, 0, 0, time.Local)
	if today9am.Weekday() == time.Sunday {
		today9am = today9am.AddDate(0, 0, 1)
	}

	mkAppt := func(id, clientID, service string, dt time.Time, status models.AppointmentStatus, notes *string) models.Appointment {
		return models.Appointment{
			ID:        id,
			ClientID:  clientID,
			Service:   service,
			Price:     models.ServicePrices[service],
			Duration:  models.ServiceDurations[service],
			DateTime:  dt.UTC(),
			Status:    status,
			Notes:     notes,
			CreatedAt: now.AddDate(0, 0, -7),
			UpdatedAt: now,
		}
	}

	s.state.Appointments = []models.Appointment{
		mkAppt("seed-appt-01", "seed-client-01", "Corte + Barba", today9am.AddDate(0, 0, 1), models.StatusPending, strPtr("Degradê navalhado + toalha quente")),
		mkAppt("seed-appt-02", "seed-client-02", "Corte de Cabelo", today9am.AddDate(0, 0, 1).Add(90*time.Minute), models.StatusPending, strPtr("Corte social na tesoura")),
		mkAppt("seed-appt-03", "seed-client-03", "Corte Completo", today9am.AddDate(0, 0, 2).Add(4*time.Hour), models.StatusPending, strPtr("Combo VIP noivo")),
		mkAppt("seed-appt-04", "seed-client-04", "Corte + Barba + Bigode", today9am.AddDate(0, 0, -1), models.StatusCompleted, strPtr("Cliente fiel")),
		mkAppt("seed-appt-05", "seed-client-05", "Corte de Cabelo", today9am.AddDate(0, 0, -1).Add(2*time.Hour), models.StatusCompleted, nil),
		mkAppt("seed-appt-06", "seed-client-06", "Barba", today9am.AddDate(0, 0, -2).Add(3*time.Hour), models.StatusCompleted, strPtr("Barboterapia com ozônio")),
		mkAppt("seed-appt-07", "seed-client-01", "Corte + Sobrancelha", today9am.AddDate(0, 0, -5), models.StatusCompleted, nil),
		mkAppt("seed-appt-08", "seed-client-02", "Corte + Barba", today9am.AddDate(0, 0, -3).Add(5*time.Hour), models.StatusCancelled, strPtr("Cliente precisou viajar")),
		mkAppt("seed-appt-09", "seed-client-03", "Corte Completo", today9am.AddDate(0, -1, 0), models.StatusCompleted, nil),
		mkAppt("seed-appt-10", "seed-client-04", "Corte + Barba", today9am.AddDate(0, -1, -5), models.StatusCompleted, nil),
	}
}

// Authenticate verifies user email & password
func (s *Store) Authenticate(email, password string) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cleanEmail := strings.ToLower(strings.TrimSpace(email))
	for _, u := range s.state.Users {
		if strings.ToLower(u.Email) == cleanEmail {
			hash, ok := s.state.Passwords[u.ID]
			if !ok || !auth.VerifyPassword(password, hash) {
				return nil, ErrInvalidCredentials
			}
			userCopy := u
			return &userCopy, nil
		}
	}
	return nil, ErrInvalidCredentials
}

func (s *Store) GetUserByID(id string) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, u := range s.state.Users {
		if u.ID == id {
			userCopy := u
			return &userCopy, nil
		}
	}
	return nil, ErrNotFound
}

func (s *Store) GetDBStatus() map[string]any {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var adminUser *models.User
	for _, u := range s.state.Users {
		if u.Role == models.RoleAdmin {
			uCopy := u
			adminUser = &uCopy
			break
		}
	}

	return map[string]any{
		"userCount":         len(s.state.Users),
		"clientCount":       len(s.state.Clients),
		"appointmentCount":  len(s.state.Appointments),
		"adminExists":       adminUser != nil,
		"adminUser":         adminUser,
		"databaseConnected": true,
		"engine":            "Go Native Concurrent Store (PostgreSQL/JSON Compatible)",
		"timestamp":         time.Now().UTC().Format(time.RFC3339),
	}
}

// Clients CRUD

func (s *Store) ListClients(search string, page, limit int) ([]models.Client, models.Pagination) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	q := strings.ToLower(strings.TrimSpace(search))
	var filtered []models.Client

	for _, c := range s.state.Clients {
		if q != "" {
			matchName := strings.Contains(strings.ToLower(c.Name), q)
			matchPhone := strings.Contains(c.Phone, q)
			matchEmail := c.Email != nil && strings.Contains(strings.ToLower(*c.Email), q)
			if !matchName && !matchPhone && !matchEmail {
				continue
			}
		}

		enriched := s.enrichClientLocked(c, 5)
		filtered = append(filtered, enriched)
	}

	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].CreatedAt.After(filtered[j].CreatedAt)
	})

	total := len(filtered)
	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	start := (page - 1) * limit
	end := start + limit
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	items := filtered[start:end]
	if items == nil {
		items = []models.Client{}
	}

	return items, models.Pagination{
		Page:            page,
		Limit:           limit,
		Total:           total,
		TotalPages:      totalPages,
		HasNextPage:     page < totalPages,
		HasPreviousPage: page > 1,
	}
}

func (s *Store) enrichClientLocked(c models.Client, maxAppts int) models.Client {
	var appts []models.Appointment
	pendingCount := 0
	for _, a := range s.state.Appointments {
		if a.ClientID == c.ID {
			aCopy := a
			aCopy.Price = models.ServicePrices[aCopy.Service]
			aCopy.Duration = models.ServiceDurations[aCopy.Service]
			appts = append(appts, aCopy)
			if a.Status == models.StatusPending {
				pendingCount++
			}
		}
	}

	sort.Slice(appts, func(i, j int) bool {
		return appts[i].DateTime.After(appts[j].DateTime)
	})

	c.TotalAppointments = len(appts)
	c.PendingAppointments = pendingCount
	if len(appts) > 0 {
		last := appts[0]
		c.LastAppointment = &last
	}
	if maxAppts > 0 && len(appts) > maxAppts {
		c.Appointments = appts[:maxAppts]
	} else {
		c.Appointments = appts
	}
	if c.Appointments == nil {
		c.Appointments = []models.Appointment{}
	}
	return c
}

func (s *Store) GetClient(id string) (*models.Client, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, c := range s.state.Clients {
		if c.ID == id {
			enriched := s.enrichClientLocked(c, 0)
			return &enriched, nil
		}
	}
	return nil, ErrNotFound
}

func (s *Store) CreateClient(name, phone string, email *string) (*models.Client, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, c := range s.state.Clients {
		if c.Phone == phone {
			return nil, ErrClientPhoneExists
		}
		if email != nil && *email != "" && c.Email != nil && strings.EqualFold(*c.Email, *email) {
			return nil, ErrClientEmailExists
		}
	}

	now := time.Now().UTC()
	var cleanEmail *string
	if email != nil && strings.TrimSpace(*email) != "" {
		e := strings.TrimSpace(*email)
		cleanEmail = &e
	}

	client := models.Client{
		ID:                  auth.GenerateID("cli"),
		Name:                strings.TrimSpace(name),
		Phone:               phone,
		Email:               cleanEmail,
		CreatedAt:           now,
		UpdatedAt:           now,
		Appointments:        []models.Appointment{},
		TotalAppointments:   0,
		PendingAppointments: 0,
	}

	s.state.Clients = append(s.state.Clients, client)
	_ = s.save()
	return &client, nil
}

func (s *Store) UpdateClient(id string, name, phone, email *string) (*models.Client, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	for i, c := range s.state.Clients {
		if c.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return nil, ErrNotFound
	}

	existing := s.state.Clients[idx]

	if phone != nil && *phone != "" && *phone != existing.Phone {
		for _, c := range s.state.Clients {
			if c.ID != id && c.Phone == *phone {
				return nil, ErrClientPhoneExists
			}
		}
		existing.Phone = *phone
	}

	if email != nil {
		trimmed := strings.TrimSpace(*email)
		if trimmed == "" {
			existing.Email = nil
		} else {
			for _, c := range s.state.Clients {
				if c.ID != id && c.Email != nil && strings.EqualFold(*c.Email, trimmed) {
					return nil, ErrClientEmailExists
				}
			}
			existing.Email = &trimmed
		}
	}

	if name != nil && strings.TrimSpace(*name) != "" {
		existing.Name = strings.TrimSpace(*name)
	}

	existing.UpdatedAt = time.Now().UTC()
	s.state.Clients[idx] = existing
	_ = s.save()

	enriched := s.enrichClientLocked(existing, 5)
	return &enriched, nil
}

func (s *Store) DeleteClient(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	for i, c := range s.state.Clients {
		if c.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return ErrNotFound
	}

	for _, a := range s.state.Appointments {
		if a.ClientID == id && a.Status == models.StatusPending {
			return ErrClientHasPendingAppts
		}
	}

	// Remove client and cascade non-pending appointments
	s.state.Clients = append(s.state.Clients[:idx], s.state.Clients[idx+1:]...)
	var remainingAppts []models.Appointment
	for _, a := range s.state.Appointments {
		if a.ClientID != id {
			remainingAppts = append(remainingAppts, a)
		}
	}
	s.state.Appointments = remainingAppts
	_ = s.save()
	return nil
}

// Appointments CRUD

type AppointmentQuery struct {
	Status    string
	StartDate *time.Time
	EndDate   *time.Time
	Search    string
	Page      int
	Limit     int
}

func (s *Store) ListAppointments(q AppointmentQuery) ([]models.Appointment, models.Pagination) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if q.Page < 1 {
		q.Page = 1
	}
	if q.Limit < 1 || q.Limit > 100 {
		q.Limit = 50
	}

	clientMap := make(map[string]models.ClientSummary, len(s.state.Clients))
	for _, c := range s.state.Clients {
		clientMap[c.ID] = models.ClientSummary{
			ID:    c.ID,
			Name:  c.Name,
			Phone: c.Phone,
			Email: c.Email,
		}
	}

	searchLower := strings.ToLower(strings.TrimSpace(q.Search))
	var filtered []models.Appointment

	for _, a := range s.state.Appointments {
		if q.Status != "" && string(a.Status) != q.Status {
			continue
		}
		if q.StartDate != nil && a.DateTime.Before(*q.StartDate) {
			continue
		}
		if q.EndDate != nil && a.DateTime.After(*q.EndDate) {
			continue
		}

		clientSummary, hasClient := clientMap[a.ClientID]
		if searchLower != "" {
			matchService := strings.Contains(strings.ToLower(a.Service), searchLower)
			matchNotes := a.Notes != nil && strings.Contains(strings.ToLower(*a.Notes), searchLower)
			matchClient := hasClient && (strings.Contains(strings.ToLower(clientSummary.Name), searchLower) ||
				strings.Contains(clientSummary.Phone, searchLower) ||
				(clientSummary.Email != nil && strings.Contains(strings.ToLower(*clientSummary.Email), searchLower)))
			if !matchService && !matchNotes && !matchClient {
				continue
			}
		}

		aCopy := a
		aCopy.Price = models.ServicePrices[aCopy.Service]
		aCopy.Duration = models.ServiceDurations[aCopy.Service]
		if hasClient {
			cs := clientSummary
			aCopy.Client = &cs
		}
		filtered = append(filtered, aCopy)
	}

	sort.Slice(filtered, func(i, j int) bool {
		if filtered[i].DateTime.Equal(filtered[j].DateTime) {
			return filtered[i].CreatedAt.After(filtered[j].CreatedAt)
		}
		return filtered[i].DateTime.After(filtered[j].DateTime)
	})

	total := len(filtered)
	totalPages := int(math.Ceil(float64(total) / float64(q.Limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	start := (q.Page - 1) * q.Limit
	end := start + q.Limit
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	items := filtered[start:end]
	if items == nil {
		items = []models.Appointment{}
	}

	return items, models.Pagination{
		Page:            q.Page,
		Limit:           q.Limit,
		Total:           total,
		TotalPages:      totalPages,
		HasNextPage:     q.Page < totalPages,
		HasPreviousPage: q.Page > 1,
	}
}

func (s *Store) GetAppointment(id string) (*models.Appointment, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, a := range s.state.Appointments {
		if a.ID == id {
			aCopy := a
			aCopy.Price = models.ServicePrices[aCopy.Service]
			aCopy.Duration = models.ServiceDurations[aCopy.Service]
			for _, c := range s.state.Clients {
				if c.ID == a.ClientID {
					aCopy.Client = &models.ClientSummary{
						ID:    c.ID,
						Name:  c.Name,
						Phone: c.Phone,
						Email: c.Email,
					}
					break
				}
			}
			return &aCopy, nil
		}
	}
	return nil, ErrNotFound
}

func (s *Store) CreateAppointment(clientID, service string, dateTime time.Time, notes *string) (*models.Appointment, string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var clientSummary *models.ClientSummary
	for _, c := range s.state.Clients {
		if c.ID == clientID {
			clientSummary = &models.ClientSummary{
				ID:    c.ID,
				Name:  c.Name,
				Phone: c.Phone,
				Email: c.Email,
			}
			break
		}
	}
	if clientSummary == nil {
		return nil, "", ErrNotFound
	}

	// Check 30-minute conflict window
	tolerance := 30 * time.Minute
	startWindow := dateTime.Add(-tolerance)
	endWindow := dateTime.Add(tolerance)

	for _, a := range s.state.Appointments {
		if a.Status == models.StatusCancelled {
			continue
		}
		if (a.DateTime.Equal(startWindow) || a.DateTime.After(startWindow)) &&
			(a.DateTime.Equal(endWindow) || a.DateTime.Before(endWindow)) {
			conflictName := "outro cliente"
			for _, c := range s.state.Clients {
				if c.ID == a.ClientID {
					conflictName = c.Name
					break
				}
			}
			return nil, conflictName, ErrAppointmentConflict
		}
	}

	now := time.Now().UTC()
	var cleanNotes *string
	if notes != nil && strings.TrimSpace(*notes) != "" {
		n := strings.TrimSpace(*notes)
		cleanNotes = &n
	}

	appt := models.Appointment{
		ID:        auth.GenerateID("apt"),
		ClientID:  clientID,
		Service:   service,
		Price:     models.ServicePrices[service],
		Duration:  models.ServiceDurations[service],
		DateTime:  dateTime.UTC(),
		Status:    models.StatusPending,
		Notes:     cleanNotes,
		CreatedAt: now,
		UpdatedAt: now,
		Client:    clientSummary,
	}

	s.state.Appointments = append(s.state.Appointments, appt)
	_ = s.save()
	return &appt, "", nil
}

func (s *Store) UpdateAppointment(id string, status models.AppointmentStatus, notes *string, service *string, dateTime *time.Time) (*models.Appointment, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	for i, a := range s.state.Appointments {
		if a.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return nil, ErrNotFound
	}

	appt := s.state.Appointments[idx]
	if status != "" {
		appt.Status = status
	}
	if notes != nil {
		trimmed := strings.TrimSpace(*notes)
		if trimmed == "" {
			appt.Notes = nil
		} else {
			appt.Notes = &trimmed
		}
	}
	if service != nil && models.IsValidService(*service) {
		appt.Service = *service
	}
	if dateTime != nil {
		appt.DateTime = dateTime.UTC()
	}
	appt.Price = models.ServicePrices[appt.Service]
	appt.Duration = models.ServiceDurations[appt.Service]
	appt.UpdatedAt = time.Now().UTC()

	s.state.Appointments[idx] = appt
	_ = s.save()

	for _, c := range s.state.Clients {
		if c.ID == appt.ClientID {
			appt.Client = &models.ClientSummary{
				ID:    c.ID,
				Name:  c.Name,
				Phone: c.Phone,
				Email: c.Email,
			}
			break
		}
	}

	return &appt, nil
}

func (s *Store) DeleteAppointment(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	for i, a := range s.state.Appointments {
		if a.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return ErrNotFound
	}

	if s.state.Appointments[idx].Status == models.StatusCompleted {
		return ErrAppointmentCompleted
	}

	s.state.Appointments = append(s.state.Appointments[:idx], s.state.Appointments[idx+1:]...)
	_ = s.save()
	return nil
}

func (s *Store) GetDashboardStats(period string) models.DashboardStats {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if period == "" {
		period = "month"
	}

	now := time.Now().UTC()
	var startDate time.Time
	switch period {
	case "day":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	case "week":
		startDate = now.AddDate(0, 0, -7)
	case "year":
		startDate = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, time.UTC)
	default:
		period = "month"
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	}

	clientMap := make(map[string]models.ClientSummary, len(s.state.Clients))
	for _, c := range s.state.Clients {
		clientMap[c.ID] = models.ClientSummary{
			ID:    c.ID,
			Name:  c.Name,
			Phone: c.Phone,
			Email: c.Email,
		}
	}

	totalClients := len(s.state.Clients)
	totalAppointments := len(s.state.Appointments)
	pendingCount := 0
	completedCount := 0
	cancelledCount := 0
	estimatedRevenue := 0.0
	pendingRevenue := 0.0

	var upcoming []models.Appointment
	next7Days := now.AddDate(0, 0, 14)

	serviceCounter := make(map[string]int)
	sixMonthsAgo := now.AddDate(0, -6, 0)
	monthlyStats := make(map[string]models.MonthlyStat)

	for _, a := range s.state.Appointments {
		price := models.ServicePrices[a.Service]
		switch a.Status {
		case models.StatusPending:
			pendingCount++
			pendingRevenue += price
		case models.StatusCompleted:
			completedCount++
			estimatedRevenue += price
		case models.StatusCancelled:
			cancelledCount++
		}

		if a.Status == models.StatusPending && (a.DateTime.After(now.Add(-24*time.Hour)) && a.DateTime.Before(next7Days)) {
			aCopy := a
			aCopy.Price = price
			aCopy.Duration = models.ServiceDurations[a.Service]
			if cs, ok := clientMap[a.ClientID]; ok {
				csCopy := cs
				aCopy.Client = &csCopy
			}
			upcoming = append(upcoming, aCopy)
		}

		if a.Status == models.StatusCompleted && (a.DateTime.Equal(startDate) || a.DateTime.After(startDate)) {
			serviceCounter[a.Service]++
		}

		if a.DateTime.After(sixMonthsAgo) {
			monthKey := fmt.Sprintf("%04d-%02d", a.DateTime.Year(), a.DateTime.Month())
			st := monthlyStats[monthKey]
			st.Total++
			switch a.Status {
			case models.StatusCompleted:
				st.Completed++
				st.Revenue += price
			case models.StatusCancelled:
				st.Cancelled++
			case models.StatusPending:
				st.Pending++
			}
			monthlyStats[monthKey] = st
		}
	}

	sort.Slice(upcoming, func(i, j int) bool {
		return upcoming[i].DateTime.Before(upcoming[j].DateTime)
	})
	if len(upcoming) > 6 {
		upcoming = upcoming[:6]
	}
	if upcoming == nil {
		upcoming = []models.Appointment{}
	}

	var topServices []models.ServiceCount
	for svc, count := range serviceCounter {
		topServices = append(topServices, models.ServiceCount{
			Service: svc,
			Count:   count,
			Revenue: float64(count) * models.ServicePrices[svc],
		})
	}
	sort.Slice(topServices, func(i, j int) bool {
		if topServices[i].Count == topServices[j].Count {
			return topServices[i].Service < topServices[j].Service
		}
		return topServices[i].Count > topServices[j].Count
	})
	if len(topServices) > 5 {
		topServices = topServices[:5]
	}
	if topServices == nil {
		topServices = []models.ServiceCount{}
	}

	completionRate := 0
	cancellationRate := 0
	if totalAppointments > 0 {
		completionRate = int(math.Round(float64(completedCount) / float64(totalAppointments) * 100))
		cancellationRate = int(math.Round(float64(cancelledCount) / float64(totalAppointments) * 100))
	}

	return models.DashboardStats{
		Overview: models.DashboardOverview{
			TotalClients:          totalClients,
			TotalAppointments:     totalAppointments,
			PendingAppointments:   pendingCount,
			CompletedAppointments: completedCount,
			CancelledAppointments: cancelledCount,
			CompletionRate:        completionRate,
			CancellationRate:      cancellationRate,
			EstimatedRevenue:      estimatedRevenue,
			PendingRevenue:        pendingRevenue,
		},
		RecentAppointments: upcoming,
		TopServices:        topServices,
		MonthlyStats:       monthlyStats,
		Period:             period,
		GeneratedAt:        now.Format(time.RFC3339),
	}
}

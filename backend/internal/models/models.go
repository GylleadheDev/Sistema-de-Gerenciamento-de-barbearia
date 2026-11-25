package models

import "time"

type UserRole string

const (
	RoleAdmin  UserRole = "ADMIN"
	RoleBarber UserRole = "BARBER"
)

type AppointmentStatus string

const (
	StatusPending   AppointmentStatus = "PENDING"
	StatusCompleted AppointmentStatus = "COMPLETED"
	StatusCancelled AppointmentStatus = "CANCELLED"
)

var ValidServices = []string{
	"Corte de Cabelo",
	"Barba",
	"Corte + Barba",
	"Corte + Barba + Bigode",
	"Sobrancelha",
	"Corte + Sobrancelha",
	"Barba + Bigode",
	"Corte Completo",
}

var ServicePrices = map[string]float64{
	"Corte de Cabelo":        45.0,
	"Barba":                  35.0,
	"Corte + Barba":          70.0,
	"Corte + Barba + Bigode": 80.0,
	"Sobrancelha":            20.0,
	"Corte + Sobrancelha":    60.0,
	"Barba + Bigode":         45.0,
	"Corte Completo":         95.0,
}

var ServiceDurations = map[string]int{
	"Corte de Cabelo":        40,
	"Barba":                  30,
	"Corte + Barba":          60,
	"Corte + Barba + Bigode": 75,
	"Sobrancelha":            15,
	"Corte + Sobrancelha":    50,
	"Barba + Bigode":         40,
	"Corte Completo":         90,
}

func IsValidService(s string) bool {
	for _, v := range ValidServices {
		if v == s {
			return true
		}
	}
	return false
}

type User struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	EmailVerified bool      `json:"emailVerified"`
	Image         *string   `json:"image,omitempty"`
	Role          UserRole  `json:"role"`
	PasswordHash  string    `json:"-"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type Client struct {
	ID                  string        `json:"id"`
	Name                string        `json:"name"`
	Phone               string        `json:"phone"`
	Email               *string       `json:"email,omitempty"`
	CreatedAt           time.Time     `json:"createdAt"`
	UpdatedAt           time.Time     `json:"updatedAt"`
	Appointments        []Appointment `json:"appointments,omitempty"`
	TotalAppointments   int           `json:"totalAppointments"`
	PendingAppointments int           `json:"pendingAppointments"`
	LastAppointment     *Appointment  `json:"lastAppointment,omitempty"`
}

type ClientSummary struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Phone string  `json:"phone"`
	Email *string `json:"email,omitempty"`
}

type Appointment struct {
	ID        string            `json:"id"`
	ClientID  string            `json:"clientId"`
	Service   string            `json:"service"`
	Price     float64           `json:"price"`
	Duration  int               `json:"duration"`
	DateTime  time.Time         `json:"dateTime"`
	Status    AppointmentStatus `json:"status"`
	Notes     *string           `json:"notes,omitempty"`
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt time.Time         `json:"updatedAt"`
	Client    *ClientSummary    `json:"client,omitempty"`
}

type Pagination struct {
	Page            int  `json:"page"`
	Limit           int  `json:"limit"`
	Total           int  `json:"total"`
	TotalPages      int  `json:"totalPages"`
	HasNextPage     bool `json:"hasNextPage"`
	HasPreviousPage bool `json:"hasPreviousPage"`
}

type DashboardOverview struct {
	TotalClients          int     `json:"totalClients"`
	TotalAppointments     int     `json:"totalAppointments"`
	PendingAppointments   int     `json:"pendingAppointments"`
	CompletedAppointments int     `json:"completedAppointments"`
	CancelledAppointments int     `json:"cancelledAppointments"`
	CompletionRate        int     `json:"completionRate"`
	CancellationRate      int     `json:"cancellationRate"`
	EstimatedRevenue      float64 `json:"estimatedRevenue"`
	PendingRevenue        float64 `json:"pendingRevenue"`
}

type ServiceCount struct {
	Service string  `json:"service"`
	Count   int     `json:"count"`
	Revenue float64 `json:"revenue"`
}

type MonthlyStat struct {
	Total     int     `json:"total"`
	Completed int     `json:"completed"`
	Cancelled int     `json:"cancelled"`
	Pending   int     `json:"pending"`
	Revenue   float64 `json:"revenue"`
}

type DashboardStats struct {
	Overview           DashboardOverview      `json:"overview"`
	RecentAppointments []Appointment          `json:"recentAppointments"`
	TopServices        []ServiceCount         `json:"topServices"`
	MonthlyStats       map[string]MonthlyStat `json:"monthlyStats"`
	Period             string                 `json:"period"`
	GeneratedAt        string                 `json:"generatedAt"`
}

package models

import "time"

type Gallery struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Title     string    `gorm:"type:varchar(255);not null" json:"title"`
	ImageURL  string    `gorm:"type:varchar(500);not null" json:"image_url"`
	Caption   string    `gorm:"type:text" json:"caption"`
	Category  string    `gorm:"type:varchar(100);index" json:"category"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Gallery) TableName() string {
	return "gallery"
}

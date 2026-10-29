package models

import "time"

type News struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Title       string     `gorm:"type:varchar(255);not null" json:"title"`
	Slug        string     `gorm:"type:varchar(255);unique;not null" json:"slug"`
	Excerpt     string     `gorm:"type:varchar(500)" json:"excerpt"`
	Content     string     `gorm:"type:text;not null" json:"content"`
	CoverImage  string     `gorm:"type:varchar(500)" json:"cover_image"`
	AuthorID    *uint      `json:"author_id"`
	Author      *User      `gorm:"foreignKey:AuthorID;constraint:OnDelete:SET NULL" json:"author,omitempty"`
	Status      string     `gorm:"type:varchar(20);default:'draft';index" json:"status"`
	PublishedAt *time.Time `json:"published_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (News) TableName() string {
	return "news"
}

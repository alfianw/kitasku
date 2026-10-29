package utils

import (
	"strings"
	"unicode"
)

func Slugify(value string) string {
	var builder strings.Builder
	lastWasDash := false

	for _, r := range strings.ToLower(strings.TrimSpace(value)) {
		switch {
		case unicode.IsLetter(r) || unicode.IsDigit(r):
			builder.WriteRune(r)
			lastWasDash = false
		default:
			if !lastWasDash && builder.Len() > 0 {
				builder.WriteByte('-')
				lastWasDash = true
			}
		}
	}

	slug := strings.Trim(builder.String(), "-")
	if slug == "" {
		return "untitled"
	}
	return slug
}

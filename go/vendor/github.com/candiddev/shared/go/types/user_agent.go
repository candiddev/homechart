package types

import "strings"

// UserAgent is the browser type for a session.
type UserAgent string

// UserAgent is the browser type for a session.
const (
	UserAgentUnknown UserAgent = "unknown"
	UserAgentAPI     UserAgent = "api"
	UserAgentChrome  UserAgent = "chrome"
	UserAgentEdge    UserAgent = "edge"
	UserAgentFirefox UserAgent = "firefox"
	UserAgentSafari  UserAgent = "safari"
)

// ParseUserAgent tries to parse a user agent string.
func ParseUserAgent(useragent string) UserAgent {
	switch {
	case strings.Contains(useragent, "Edg"):
		return UserAgentEdge
	case strings.Contains(useragent, "Chrome"):
		return UserAgentChrome
	case strings.Contains(useragent, "Firefox"):
		return UserAgentFirefox
	case strings.Contains(useragent, "Safari"):
		return UserAgentSafari
	}

	return UserAgentUnknown
}

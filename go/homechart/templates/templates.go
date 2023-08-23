// Package templates is a collection of templated strings.
package templates

import (
	"fmt"

	"github.com/candiddev/homechart/go/yaml8n"
)

func AssistantEventNext(name, startTime string) string {
	return fmt.Sprintf("Your next event is %s, starting at %s", name, startTime)
}

func AssistantEventNextLeave(leaveByTime string) string {
	return fmt.Sprintf("  You'll want to leave at %s.", leaveByTime)
}

func EmailEmailAddressChangeConfirmationBody(code yaml8n.ISO639Code, baseURL, verifyID, verifyToken string) string {
	return fmt.Sprintf("%s %s\n\n%s", yaml8n.EmailEmailAddressChangeConfirmationBody.Translate(code), EmailVerificationBody(code, baseURL, verifyID, verifyToken), yaml8n.EmailHelpBody.Translate(code))
}

func EmailEmailAddressUpdatedBody(code yaml8n.ISO639Code, emailAddress string) string {
	return fmt.Sprintf("%s %s", yaml8n.EmailEmailAddressUpdateBody.Translate(code), emailAddress)
}

func EmailEventReminderSubject(code yaml8n.ISO639Code, name string) string {
	return fmt.Sprintf("[%s] %s", yaml8n.EmailPushEventReminderSubject.Translate(code), name)
}

func EmailExpiredBody(code yaml8n.ISO639Code, expiredDate, baseURL string) string {
	return fmt.Sprintf(`%s:

%s/subscription`, fmt.Sprintf(yaml8n.EmailVerificationBody.Translate(code), expiredDate), baseURL)
}

func EmailExpiringBody(code yaml8n.ISO639Code, expirationDate, baseURL string) string {
	return fmt.Sprintf(`%s:

%s/subscription`, fmt.Sprintf(yaml8n.EmailVerificationBody.Translate(code), expirationDate), baseURL)
}

func EmailInviteBody(code yaml8n.ISO639Code, inviter, invitee, baseURL, token string) string {
	return fmt.Sprintf(`%s:

%s/settings/households?token=%s`, fmt.Sprintf(yaml8n.EmailInviteBody.Translate(code), inviter, invitee), baseURL, token)
}

func EmailInviteSubject(code yaml8n.ISO639Code, inviter string) string {
	return fmt.Sprintf("%s %s", inviter, yaml8n.EmailInviteSubject.Translate(code))
}

func EmailMealPlanReminderCookBody(code yaml8n.ISO639Code, recipe string, link string) string {
	return fmt.Sprintf("%s %s:\n%s", yaml8n.EmailMealPlanReminderCookBody.Translate(code), recipe, link)
}

func EmailMealPlanReminderCookSubject(code yaml8n.ISO639Code, recipe string) string {
	return fmt.Sprintf(`[%s] %s`, yaml8n.EmailPushMealPlanReminderCookSubject.Translate(code), recipe)
}

func EmailMealPlanReminderPrepBody(code yaml8n.ISO639Code, recipe string, link string) string {
	return fmt.Sprintf("%s %s:\n%s", yaml8n.EmailMealPlanReminderPrepBody.Translate(code), recipe, link)
}

func EmailMealPlanReminderPrepSubject(code yaml8n.ISO639Code, recipe string) string {
	return fmt.Sprintf("[%s] %s", yaml8n.EmailPushMealPlanReminderPrepSubject.Translate(code), recipe)
}

func EmailPasswordResetBodySuccess(code yaml8n.ISO639Code, baseURL, emailAddress, token string) string {
	return fmt.Sprintf(`%s:

%s/reset?email=%s&token=%s

%s`, yaml8n.EmailPasswordResetBodySuccess.Translate(code), baseURL, emailAddress, token, yaml8n.EmailHelpBody.Translate(code))
}

func EmailTaskReminderBody(code yaml8n.ISO639Code, name, link string) string {
	return fmt.Sprintf("%s %s\n\n%s", yaml8n.EmailTaskReminderBody.Translate(code), name, link)
}

func EmailTaskReminderSubject(code yaml8n.ISO639Code, name string) string {
	return fmt.Sprintf("[%s] %s", yaml8n.EmailPushTaskReminderSubject.Translate(code), name)
}

func EmailVerificationBody(code yaml8n.ISO639Code, baseURL, id, token string) string {
	return fmt.Sprintf(`  %s:

%s/verify?id=%s&token=%s
`, yaml8n.EmailVerificationBody.Translate(code), baseURL, id, token)
}

func EmailTwoFactorEnabledBody(code yaml8n.ISO639Code, backupCode string) string {
	return fmt.Sprintf(`%s:

%s
`, yaml8n.EmailTwoFactorEnabledBody.Translate(code), backupCode)
}

func PushDailyAgendaSubject(code yaml8n.ISO639Code, day string) string {
	return fmt.Sprintf("%s %s", yaml8n.PushDailyAgendaSubject.Translate(code), day)
}

func PushMealPlanReminderBody(code yaml8n.ISO639Code, recipe string) string {
	return fmt.Sprintf("%s\n%s", recipe, yaml8n.PushMealPlanReminderBody.Translate(code))
}

func PushTaskCompleteBody(code yaml8n.ISO639Code, member, task string) string {
	return fmt.Sprintf("%s %s %s", member, yaml8n.PushTaskCompleteBody.Translate(code), task)
}

func PushTaskReminderBody(code yaml8n.ISO639Code, task string) string {
	return fmt.Sprintf("%s\n%s", task, yaml8n.PushTaskReminderBody.Translate(code))
}

const (
	DailyAgendaBody = `{{ if .Empty -}}
{{ .BodyNothing }}
{{ else -}}
{{ if gt .CountBudgetRecurrences 0 -}}
{{ .CountBudgetRecurrences }} {{ if gt .CountBudgetRecurrences 1 -}}{{ .RecurringTransactions }}{{ else }}{{ .RecurringTransaction }}{{- end }}
{{ end -}}
{{ if gt .CountCalendarEvents 0 -}}
{{ .CountCalendarEvents }} {{ if gt .CountCalendarEvents 1 -}}{{ .Events }}{{ else }}{{ .Event }}{{- end }}
{{ end -}}
{{ if gt .CountCookMealPlans 0 -}}
{{ .CountCookMealPlans }} {{ if gt .CountCookMealPlans 1 -}}{{ .MealPlans }}{{ else }}{{ .MealPlan }}{{- end }}
{{ end -}}
{{ if gt .CountPlanTasks 0 -}}
{{ .CountPlanTasks }} {{ if gt .CountPlanTasks 1 -}}{{ .Tasks }}{{ else }}{{ .Task }}{{- end }}
{{ end -}}
{{- end }}`

	EventReminderBody = `{{ .BodyHeader }}: {{ .Name }}

{{ .BodyStarts }} {{ .Starts }}
{{- if gt .TravelTime 0 }}
{{ .BodyLeaveBy }} {{ .LeaveBy }}
{{- end }}`

	ContactUsBodySMTP = `**Email Address:** %s

**Source URL:** %s

**Self-Hosted:** %t

**Trial:** %t

**Message:** %s`
	ContactUsSubjectSMTPFeedback = "New Product Feedback"
	ContactUsSubjectSMTPSupport  = "New Support Request"
)

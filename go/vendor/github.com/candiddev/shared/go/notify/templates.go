package notify

const (
	smtpTemplate = `From: "{{ AppName }}" <{{ FromAddress }}>
To: {{ .To }}
{{- if ReplyTo }}
Reply-To: {{ ReplyTo }}
{{- end }}
Subject: {{ .Subject | replace "\n" "" }}
MIME-Version: 1.0
Content-type: multipart/mixed; boundary="message_mixed"
List-Unsubscribe: <{{ BaseURL }}{{ UnsubscribePath }}>

--message_mixed
Content-type: multipart/alternative; boundary="message_alternative"

--message_alternative
Content-Type: text/plain; charset="utf-8"

{{ .Body | replace "<.*?>" "" }}

---
{{ FooterFrom }} ({{ BaseURL }}).
{{ FooterUpdate }}: {{ BaseURL }}{{ UnsubscribePath }}}

--message_alternative
Content-Type: text/html; charset="utf-8"

<!DOCTYPE html>
<html>
	<head>
		<meta name="viewport" content="width=device-width" />
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
		<title>{{ AppName }}</title>
	</head>
	<body style="
		background-color: #eeeeee;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
		font-size: 14px;
		line-height: 1.4;
		margin: 0;
		padding: 0;
		-ms-text-size-adjust: 100%;
		-webkit-font-smoothing: antialiased;
		-webkit-text-size-adjust: 100%; 
	">
		<table cellpadding="0" cellspacing="0" style="width: 100%;">
			<tr>
				<td>
					<div style="
						box-sizing: border-box;
						display: block;
						margin: 0 auto;
						max-width: 580px;
						padding: 10px;
					">
						<table style="
							background: #ffffff;
							border: 1px solid #00000040;
							border-radius: 4px;
							padding: 20px;
							width: 100%; 
						">
							<tr>
								<td>
									<table cellpadding="0" cellspacing="0" style="width: 100%;">
										<tr>
											<td>
												<table cellpadding="0" cellspacing="0" style="width: 100%;">
													<tbody>
														<tr>
															<td align="center">
																<a href="{{ BaseURL }}" style="
																	color: #424242;
																	font-size: 35px;
																	font-weight: 500;
																	text-decoration: none !important;
																" target="_blank">
																	<img alt="{{ AppName }} Logo" src="{{ LogoURL }}" style="
																		border-radius: 4px;
																		box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.20);
																		height: 50px;
																		margin-right: 5px;
																		vertical-align: middle;
																	"/>
																	<span style="vertical-align: middle;">{{ AppName }}</span>
																</a>
															</td>
														</tr>
													</tbody>
												</table>
												<p style="
													color: #424242;
													margin: 0;
													padding-top: 20px;
												">
													{{ .Body }}
												</p>
											</td>
										</tr>
									</table>
								</td>
							</tr>
						</table>
						<div style="
							clear: both;
							font-size: 12px;
							margin-top: 10px;
							text-align: center;
							width: 100%;
						">
							<table cellpadding="0" cellspacing="0" style="width: 100%">
								<tr>
									<td align="center">
										<p style="
											color: #616161;
											margin: 0;
											text-align: center;
										">{{ FooterFrom }} (<a href="{{ BaseURL }}" style="color: #616161" target="_blank">{{ BaseURL }}</a>)</p>
										<a href="{{ BaseURL }}{{ UnsubscribePath }}" style="
											color: #616161;
										" target="_blank">
											<p style="
												margin: 0;
												padding-top: 10px;
											">{{ FooterUpdate }}</p>
										</a>
										<p style="
											color: #616161;
											margin: 0;
											padding-top: 10px;
										">© 2018 - 2023 Candid Development LLC</p>
									</td>
								</tr>
							</table>
						</div>
					</div>
				</td>
			</tr>
		</table>
	</body>
</html>
`
)

#!/usr/bin/env bash

export APP_NAME=homechart
export BUILD_TARGETS_BINARY="linux/amd64 linux/arm64 linux/arm/v7"
export GITHUB_REPOSITORY_ID=416805305
export INSTALL_ALL="install-go install-golangci-lint install-hugo install-node install-shellcheck install-swag install-vault"
export HOMECHART_APP_BASEURL=${HOMECHART_APP_BASEURL:-http://localhost}
export HOMECHART_APP_CLOUDENDPOINT=${HOMECHART_APP_CLOUDENDPOINT:-http://localhost}
export HOMECHART_APP_CLOUDJWT=${HOMECHART_APP_CLOUDJWT:-eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJjbG91ZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9taWtlLWRlc2t0b3AxLmNhbmRpZC5kZXYiLCJzdWIiOiJDbG91ZCIsImF1ZCI6WyJIb21lY2hhcnQiXSwiZXhwIjoxODM3NzEwNTc3LCJuYmYiOjE2ODAwMzA1NzcsImlhdCI6MTY4MDAzMDU3NywianRpIjoiN2MzNWJlNzEtMmE0OC00NjIwLTgxMGUtMDU4Njc4ODgyODAwIn0.xLDsYa_7cQnMmLF9XuxpzSllvcQVLRNsU4wgMZrddkz_Uzwj0rnZmhrh1gdUcWO_jzPHcjiK-7LgJ2Jz7SWYDw}
export HOMECHART_APP_CLOUDPRIVATEKEY=${HOMECHART_APP_CLOUDPRIVATEKEY:-MC4CAQAwBQYDK2VwBCIEIJzzEbJdbjgPN5Q1O75Fgfc3JivqiAeLq1F7XMj0c1hG}
export HOMECHART_APP_CLOUDPUBLICKEY=${HOMECHART_APP_CLOUDPUBLICKEY:-MCowBQYDK2VwAyEADL5OxQve4AvYy7L2S+ypqD0/T8t9IIT/bQFkXNQCo9I=}
export HOMECHART_APP_NOEMAILDOMAINS=${HOMECHART_APP_NOEMAILDOMAINS:-example.com}
export HOMECHART_APP_RATELIMITERKEY=${HOMECHART_APP_RATELIMITERKEY:-homechart}
export HOMECHART_APP_TIMEZONE=${HOMECHART_APP_TIMEZONE:-America/Chicago}
export HOMECHART_POSTGRESQL_DATABASE=${HOMECHART_POSTGRESQL_DATABASE:-homechart}
export HOMECHART_POSTGRESQL_HOSTNAME=${HOMECHART_POSTGRESQL_HOSTNAME:-127.0.0.1}
export HOMECHART_POSTGRESQL_PASSWORD=${HOMECHART_POSTGRESQL_PASSWORD:-homechart}
export HOMECHART_POSTGRESQL_USERNAME=${HOMECHART_POSTGRESQL_USERNAME:-homechart}
export HOMECHART_WEBPUSH_VAPIDPRIVATEKEY=${HOMECHART_WEBPUSH_VAPIDPRIVATEKEY:-3-NI4eCXzQt3ILqRmOaIuEWHCl9Lp7zrOlGhhdyy7MU}
export HOMECHART_WEBPUSH_VAPIDPUBLICKEY=${HOMECHART_WEBPUSH_VAPIDPUBLICKEY:-BMcCmv0dhitH4h1hrKHGpJbaD_kTPpaGap8AH4kjLoM7pZXPzdPgCASqZ9pMOZckHD62xvXFtfWbxLBzJGzWtU4}
export PUPPETEER_URL=${PUPPETEER_URL:-""}
export RUN_GO_ARGS="-c ${DIR}/homechart_config.yaml run"
export VAULT_GCP_HOMECHART_RELEASE=gcp/static-account/homechart-release/key
export VAULT_KV_HOMECHART=kv/dev/homechart

case ${BUILD_SOURCE} in
	main)
		VAULT_KV_HOMECHART=kv/stg/homechart
		VAULT_SSH_ROLE=homechart_stg
		;;
	tag)
		VAULT_KV_HOMECHART=kv/prd/homechart
		# shellcheck disable=SC2034
		VAULT_SSH_ROLE=homechart_prd
		;;
esac

if [[ "${BUILD_SOURCE}" != "dev" ]]; then
	. "${DIR}/shell/lib/vars.sh"
	. "${DIR}/shell/lib/install.sh"
	install-vault

	EXEC_VAULT=${BINDIR}/vault
	DEPLOY_HOSTS=$(${EXEC_VAULT} read -field=deploy_hosts "${VAULT_KV_HOMECHART}")
	export DEPLOY_HOSTS
	echo "::add-mask::${DEPLOY_HOSTS}"

	HOMECHART_APP_CLOUDPUBLICKEY=$(${EXEC_VAULT} read -field=app_cloudpublickey "${VAULT_KV_HOMECHART}")
	export HOMECHART_APP_CLOUDPUBLICKEY
	echo "::add-mask::${HOMECHART_APP_CLOUDPUBLICKEY}"

	HOMECHART_APP_NOEMAILDOMAINS=$(${EXEC_VAULT} read -field=smtp_noemaildomains "${VAULT_KV_HOMECHART}")
	export HOMECHART_APP_NOEMAILDOMAINS
	echo "::add-mask::${HOMECHART_APP_NOEMAILDOMAINS}"

	HOMECHART_APP_RATELIMITERKEY=$(${EXEC_VAULT} read -field=app_ratelimiterkey "${VAULT_KV_HOMECHART}")
	export HOMECHART_APP_RATELIMITERKEY
	echo "::add-mask::${HOMECHART_APP_RATELIMITERKEY}"

	PUPPETEER_URL=$(${EXEC_VAULT} read -field=app_baseurl "${VAULT_KV_HOMECHART}")
	export PUPPETEER_URL
	echo "::add-mask::${PUPPETEER_URL}"
fi

export BUILD_GO_VARS="-X main.appCloudPublicKey=${HOMECHART_APP_CLOUDPUBLICKEY}"

cmd build-homechart-config,bhc Build Homechart config
build-homechart-config () {
	if [[ -n ${VAULT_TOKEN} ]]; then
		cat > "${DIR}/homechart_config.yaml" << EOF
{{ \$vault := (get "${VAULT_ADDR}/v1/${VAULT_KV_HOMECHART}#x-vault-token:${VAULT_TOKEN}" | decode_json).data }}
EOF
	else
		cat > "${DIR}/homechart_config.yaml" << EOF
{{ \$vault := dict }}
EOF
	fi

	cat >> "${DIR}/homechart_config.yaml" << EOF
app:
  adminEmailAddresses:
  - jane@example.com
  baseURL: ${HOMECHART_APP_BASEURL}
  cacheControl: no-store
  cloudEndpoint: ${HOMECHART_APP_CLOUDENDPOINT}
  cloudPrivateKey: ${HOMECHART_APP_CLOUDPRIVATEKEY}
  counterTimeZone: ${HOMECHART_APP_TIMEZONE}
  debug: false
  demo: true
  featureVotes:
  - This Awesome Feature
  - This Other Feature
  - User Experience
  rateLimiterKey: ${HOMECHART_APP_RATELIMITERKEY}
  rateLimiterRate: 499-S
  systemConfigKey: config
  systemHealthKey: health
  systemMetricsKey: metrics
  systemPprofKey: pprof
  systemStopKey: stop
  uiDir: web/dist/homechart
oidc:
  appleClientID: {{ try \$vault.oidc_appleclientid }}
  appleKeyID: {{ try \$vault.oidc_applekeyid }}
  appleKeyPEMBase64: {{ try \$vault.oidc_applekeypembase64 }}
  appleTeamID: {{ try \$vault.oidc_appleteamid }}
  googleClientID: {{ try \$vault.oidc_googleclientid }}
  googleClientSecret: {{ try \$vault.oidc_googleclientsecret }}
paddle:
  planIDMonthly: {{ try \$vault.paddle_planidmonthly }}
  planIDMonthlyReferral: {{ try \$vault.paddle_planidmonthlyreferral }}
  productIDLifetime: {{ try \$vault.paddle_productidlifetime }}
  publicKeyBase64: {{ try \$vault.paddle_publickeybase64 }}
  sandbox: {{ try \$vault.paddle_sandbox }}
  vendorAuthCode: {{ try \$vault.paddle_vendorauthcode }}
  vendorID: {{ try \$vault.paddle_vendorid }}
postgresql:
  database: ${HOMECHART_POSTGRESQL_DATABASE}
  hostname: ${HOMECHART_POSTGRESQL_HOSTNAME}
  password: ${HOMECHART_POSTGRESQL_PASSWORD}
  username: ${HOMECHART_POSTGRESQL_USERNAME}
smtp:
  noEmailDomains:
  - example.com
  replyTo: Support <support@homechart.app>
tracing:
  endpoint: tempo.candid.dev
  serviceName: homechart-api
webPush:
  vapidPrivateKey: ${HOMECHART_WEBPUSH_VAPIDPRIVATEKEY}
  vapidPublicKey: ${HOMECHART_WEBPUSH_VAPIDPUBLICKEY}
EOF
}
bhc () {
	build-homechart-config
}

cmd deploy-post Run reachability tests for a Homechart instance
deploy-post () {
	printf "Testing reachability to %s..." "${PUPPETEER_URL}"

	try "while ! curl -s -k ${PUPPETEER_URL}/api | grep ${BUILD_VERSION}; do
((c++)) && ((c==60)) && exit 1
sleep 1
done" || exit 1
}

lint-web-pre () {
	run-homechart-seed
}

release-binary-pre () {
	install-go
	install-swag

	printf "Building Homechart swagger..."
	try "(cd ${DIR}/go && ${EXEC_SWAG} init -g controllers.go --md ./controllers --dir ./controllers --parseDependency -o ./controllers && rm controllers/swagger.json controllers/docs.go && sed -i 's/REPLACE/${BUILD_VERSION}/g' controllers/swagger.yaml)"

	build-web

	printf "Copying UI folder..."

	try "
rm -rf ${DIR}/go/homechart/controllers/ui
cp -R ${DIR}/web/dist ${DIR}/go/controllers/ui"
}

cmd run-homechart-api-self-hosted,rhas Run Homechart API as a self hosted instance
run-homechart-api-self-hosted () {
	build-go

	HOMECHART_APP_CLOUDJWT="" HOMECHART_POSTGRESQL_DATABASE=homechart_self_hosted "${DIR}/${BUILD_NAME}" -c "${DIR}/homechart_config.yaml" run
}
rhas () {
	run-homechart-api-self-hosted
}

cmd run-homechart-seed,rhs Run Homechart seed
run-homechart-seed () {
	build-go
	build-homechart-config
	run-postgresql-start

	printf "Running Homechart seed..."
	try "while [ ! -f ${DIR}/${BUILD_NAME} ]; do
sleep 1
done
sleep 1
HOMECHART_APP_DEBUG=false TZ=America/Chicago ${DIR}/${BUILD_NAME} -c ${DIR}/homechart_config.yaml seed ${DIR}/homechart_data.json"
}
rhs () {
	run-homechart-seed
}

cmd run-homechart-start Run Homechart containers
run-homechart-start () {
	install-air
	install-go
	install-node

	run-postgresql-start
	run-yaml8n-start

	if not-running candiddev_homechart_api; then
		printf "Running Homechart API..."
		try "mkdir -p ${DIR}/.cache
		${CR} run \
			-d \
			-e HOMECHART_APP_UIHOST=http://candiddev_homechart_ui:1080 \
			-e HOMECHART_POSTGRESQL_HOSTNAME=candiddev_postgresql \
			${CR_LOGOPTS} \
			${CR_USER} \
			--name candiddev_homechart_api \
			--network candiddev \
			-p 80:3000 \
			--restart always \
			${CR_VOLUME} \
			${CR_IMAGE} \
			./m run-air"
	fi

	if not-running candiddev_homechart_ui; then
		printf "Running Homechart UI..."
		try "${CR} run \
			-d \
			${CR_LOGOPTS} \
			${CR_USER} \
			--name candiddev_homechart_ui \
			--network candiddev \
			-p 1080:1080 \
			--restart always \
			${CR_VOLUME} \
			${CR_IMAGE} \
			./m run-web"
	fi

	printf "Vist http://localhost to get started\n"

	run-homechart-seed
}

cmd run-homechart-stop Stop Homechart containers
run-homechart-stop () {
	printf "Stopping all Homechart containers..."
	try "${CR} rm -f candiddev_homechart_api || true
${CR} rm -f candiddev_homechart_ui || true"
}

cmd test-e2e Test Homechart E2E
test-e2e () {
	if [[ ${PUPPETEER_URL} == "" ]]; then
		PUPPETEER_URL=${HOMECHART_APP_BASEURL}

		run-homechart-start
		deploy-post
	fi

	${EXEC_NPM} run e2e || ${EXEC_NPM} run e2e
}


test-go-pre () {
	build-homechart-config
}

test-web-pre () {
	run-homechart-seed
}

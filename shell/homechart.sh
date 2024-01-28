#!/usr/bin/env bash

export APP_NAME=homechart
export APP_URL=https://homechart.app
export BUILD_TARGETS_BINARY="linux/amd64 linux/arm64 linux/arm/v7"
export GITHUB_REPOSITORY_ID=416805305
export HOMECHART_app_baseURL=${HOMECHART_app_baseURL:-http://localhost}
export HOMECHART_app_cloudEndpoint=${HOMECHART_app_cloudEndpoint:-http://localhost}
export HOMECHART_app_cloudJWT=${HOMECHART_app_cloudJWT:-eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJjbG91ZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9taWtlLWRlc2t0b3AxLmNhbmRpZC5kZXYiLCJzdWIiOiJDbG91ZCIsImF1ZCI6WyJIb21lY2hhcnQiXSwiZXhwIjoxODM3NzEwNTc3LCJuYmYiOjE2ODAwMzA1NzcsImlhdCI6MTY4MDAzMDU3NywianRpIjoiN2MzNWJlNzEtMmE0OC00NjIwLTgxMGUtMDU4Njc4ODgyODAwIn0.xLDsYa_7cQnMmLF9XuxpzSllvcQVLRNsU4wgMZrddkz_Uzwj0rnZmhrh1gdUcWO_jzPHcjiK-7LgJ2Jz7SWYDw}
export HOMECHART_app_cloudPrivateKey=${HOMECHART_app_cloudPrivateKey:-'ed25519private:MC4CAQAwBQYDK2VwBCIEIJzzEbJdbjgPN5Q1O75Fgfc3JivqiAeLq1F7XMj0c1hG'}
export HOMECHART_app_cloudPublicKey=${HOMECHART_app_cloudPublicKey:-'ed25519public:MCowBQYDK2VwAyEADL5OxQve4AvYy7L2S+ypqD0/T8t9IIT/bQFkXNQCo9I='}
export HOMECHART_app_rateLimiterKey=${HOMECHART_app_rateLimiterKey:-homechart}
export HOMECHART_app_timeZone=${HOMECHART_app_timeZone:-America/Chicago}
export HOMECHART_postgresql_database=${HOMECHART_postgresql_database:-homechart}
export HOMECHART_postgresql_hostname=${HOMECHART_postgresql_hostname:-127.0.0.1}
export HOMECHART_postgresql_password=${HOMECHART_postgresql_password:-homechart}
export HOMECHART_postgresql_username=${HOMECHART_postgresql_username:-homechart}
export HOMECHART_webPush_vapidPrivateKey=${HOMECHART_webPush_vapidPrivateKey:-3-NI4eCXzQt3ILqRmOaIuEWHCl9Lp7zrOlGhhdyy7MU}
export HOMECHART_webPush_vapidPublicKey=${HOMECHART_webPush_vapidPublicKey:-BMcCmv0dhitH4h1hrKHGpJbaD_kTPpaGap8AH4kjLoM7pZXPzdPgCASqZ9pMOZckHD62xvXFtfWbxLBzJGzWtU4}
export INSTALL_ALL="install-go install-hugo install-node install-shellcheck install-swag install-vault install-yaml8n"
export PUPPETEER_URL=${PUPPETEER_URL:-""}
export RUN_GO_ARGS="-c ${DIR}/homechart_config.jsonnet run"
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

	HOMECHART_app_cloudPublicKey=$(${EXEC_VAULT} read -field=app_cloudpublickey "${VAULT_KV_HOMECHART}")
	export HOMECHART_app_cloudPublicKey
	echo "::add-mask::${HOMECHART_app_cloudPublicKey}"

	HOMECHART_app_rateLimiterKey=$(${EXEC_VAULT} read -field=app_ratelimiterkey "${VAULT_KV_HOMECHART}")
	export HOMECHART_app_rateLimiterKey
	echo "::add-mask::${HOMECHART_app_rateLimiterKey}"

	PUPPETEER_URL=$(${EXEC_VAULT} read -field=app_baseurl "${VAULT_KV_HOMECHART}")
	export PUPPETEER_URL
	echo "::add-mask::${PUPPETEER_URL}"
fi

export BUILD_GO_VARS="-X main.appCloudPublicKey=${HOMECHART_app_cloudPublicKey}"

cmd build-homechart-config,bhc Build Homechart config
build-homechart-config () {
	cat > "${DIR}/homechart_config.jsonnet" << EOF
{
  app: {
    adminEmailAddresses: [
      'jane@example.com'
    ],
    baseURL: "${HOMECHART_app_baseURL}",
    cacheControl: "no-store",
    cloudEndpoint: "${HOMECHART_app_cloudEndpoint}",
    cloudPrivateKey: "${HOMECHART_app_cloudPrivateKey}",
    counterTimeZone: "${HOMECHART_app_timeZone}",
    debug: false,
    demo: true,
    featureVotes: [
      "This Awesome Feature",
      "This Other Feature",
      "User Experience"
    ],
    rateLimiterKey: "${HOMECHART_app_rateLimiterKey}",
    rateLimiterRate: "499-S",
    systemConfigKey: "config",
    systemHealthKey: "health",
    systemMetricsKey: "metrics",
    systemPprofKey: "pprof",
    systemStopKey: "stop",
    uiDir: "web/dist/homechart"
  },
  postgresql: {
    database: "${HOMECHART_postgresql_database}",
    hostname: "${HOMECHART_postgresql_hostname}",
    password: "${HOMECHART_postgresql_password}",
    username: "${HOMECHART_postgresql_username}"
  },
  smtp: {
    noEmailDomains: [
      "example.com"
    ],
    replyTo: "Support <support@homechart.app>"
  },
  tracing: {
    endpoint: "tempo.candid.dev",
    serviceName: "homechart-api"
  },
  webPush: {
    vapidPrivateKey: "${HOMECHART_webPush_vapidPrivateKey}",
    vapidPublicKey: "${HOMECHART_webPush_vapidPublicKey}"
  }
}
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
if [[ ${BUILD_SOURCE} == 'dev' ]]; then
	${CR} logs candiddev_homechart_api
fi
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

	HOMECHART_app_cloudJWT="" HOMECHART_postgresql_database=homechart_self_hosted "${DIR}/${BUILD_NAME}" -c "${DIR}/homechart_config.jsonnet" run
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
TZ=America/Chicago ${DIR}/${BUILD_NAME} -c ${DIR}/homechart_config.jsonnet seed ${DIR}/homechart_data.json"
}
rhs () {
	run-homechart-seed
}

cmd run-homechart-start Run Homechart containers
run-homechart-start () {
	install-air
	install-go
	install-node
	install-rot

	build-homechart-config
	run-postgresql-start
	run-yaml8n-start

	ROT_privateKey="$(${EXEC_ROT} show-private-key || echo "")"

	if not-running candiddev_homechart_api; then
		printf "Running Homechart API..."
		try "mkdir -p ${DIR}/.cache
		${CR} run \
			-d \
			-e HOMECHART_app_uiHost=http://candiddev_homechart_ui:1080 \
			-e HOMECHART_postgresql_hostname=candiddev_postgresql \
			-e ROT_privateKey=${ROT_privateKey} \
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
	run-hugo-stop
	run-yaml8n-stop

	printf "Stopping all Homechart containers..."

	try "${CR} rm -f candiddev_homechart_api || true
${CR} rm -f candiddev_homechart_ui || true"
}

cmd test-e2e Test Homechart E2E
test-e2e () {
	if [[ ${PUPPETEER_URL} == "" ]]; then
		PUPPETEER_URL=${HOMECHART_app_baseURL}

		build-go
		run-homechart-start
		deploy-post
	fi

	${EXEC_NPM} run e2e || ${EXEC_NPM} run e2e
}


test-go-pre () {
	run-postgresql-start
	build-homechart-config
}

test-web-pre () {
	run-homechart-seed
}

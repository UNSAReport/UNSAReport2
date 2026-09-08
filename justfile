ENV := env_var_or_default("ENV", "dev")
ROOT := justfile_directory()

decrypt env=ENV:
    ENV={{env}} moon run decrypt

infra-up env=ENV:
    ENV={{env}} moon run infra-up

infra-down env=ENV:
    ENV={{env}} moon run infra-down

dev env=ENV:
    ENV={{env}} moon run auth:dev registry:dev website:dev

compose env=ENV *args:
    ENV={{env}} docker compose -f "{{ROOT}}/compose.{{env}}.yml" {{args}}

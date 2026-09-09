ENV := env("ENV", "dev")
ROOT := justfile_directory()

default:
    @just --list

decrypt env=ENV:
    ENV={{env}} moon run decrypt

infra-up env=ENV:
    ENV={{env}} moon run infra-up

infra-down env=ENV:
    ENV={{env}} moon run infra-down

db-migrate env=ENV:
    ENV={{env}} moon run db-migrate

dev env=ENV:
    ENV={{env}} moon run auth:dev registry:dev slides:dev website:dev

compose env=ENV *args:
    ENV={{env}} docker compose -f "{{ROOT}}/compose.{{env}}.yml" {{args}}

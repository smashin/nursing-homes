#!/usr/bin/env bash

truffle migrate
echo "$@"
exec "$@"
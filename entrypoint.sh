#!/usr/bin/env bash

truffle migrate --network stage #--reset

echo "$@"
exec "$@"

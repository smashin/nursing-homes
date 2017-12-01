#!/usr/bin/env bash

truffle migrate --network stage

echo "$@"
exec "$@"

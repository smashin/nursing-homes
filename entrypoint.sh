#!/usr/bin/env bash

truffle deploy
echo "$@"
exec "$@"
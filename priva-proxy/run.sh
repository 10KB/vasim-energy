#!/usr/bin/with-contenv bashio

EMAIL=$(bashio::config 'email')
export EMAIL

PASSWORD=$(bashio::config 'password')
export PASSWORD

LOG_LEVEL=$(bashio::config 'log_level')
export LOG_LEVEL

yarn start

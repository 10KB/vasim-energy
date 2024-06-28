#!/usr/bin/with-contenv bashio

EMAIL=$(bashio::config 'email')
export EMAIL

PASSWORD=$(bashio::config 'password')
export PASSWORD

yarn start

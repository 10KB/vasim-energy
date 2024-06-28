ARG BUILD_FROM
FROM $BUILD_FROM

ENV APP_HOME=/app

RUN mkdir -p $APP_HOME \
 && apk upgrade -U -a \
 && apk add \
    chromium \
    freetype \
    git \
    harfbuzz \
    libstdc++ \
    nodejs \
    yarn \
    nss \
    tini

WORKDIR $APP_HOME

# COPY package.json yarn.lock $APP_HOME/
# RUN yarn

# COPY ./src $APP_HOME/src
# COPY config.yaml tsconfig.json run.sh $APP_HOME

# RUN yarn build

# RUN chmod a+x /run.sh

# CMD ["/app/run.sh"]

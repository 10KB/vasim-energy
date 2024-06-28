ARG BUILD_FROM
FROM $BUILD_FROM as dev

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

###
FROM dev as builder
COPY package.json yarn.lock $APP_HOME/
RUN yarn install --no-optional && yarn cache clean
COPY . $APP_HOME
RUN yarn build

###
FROM dev as prod
ENV NODE_ENV=production
COPY package.json yarn.lock config.yaml run.sh $APP_HOME/
COPY --from=builder $APP_HOME/node_modules $APP_HOME/node_modules
COPY --from=builder $APP_HOME/dist $APP_HOME/dist
RUN chmod a+x $APP_HOME/run.sh
CMD ["/app/run.sh"]

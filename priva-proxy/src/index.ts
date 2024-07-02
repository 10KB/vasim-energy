import express from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import bodyParser from 'body-parser';
import asyncHandler from 'express-async-handler';
import morgan from 'morgan';
import { authenticatedSession, scrapeData } from './services/playwright';
import { logger } from './utils/logger';

type RequestBody = Record<
  string,
  {
    section: string;
    fields: string[];
  }
>;

type ResponseBody = Record<string, string[]>;

const app = express();
app.use(bodyParser.json());
app.use(morgan('dev', { stream: { write: (message) => logger.http(message) } }));

app.post(
  '/api',
  asyncHandler<ParamsDictionary, ResponseBody, RequestBody>(async ({ body }, response) => {
    logger.debug(`POST body payload ${JSON.stringify(body)}`);

    const { browser, context } = await authenticatedSession();

    const result = await Promise.all(
      Object.entries(body).map(async ([key, { section, fields }]) => [
        key,
        await scrapeData(context, section, fields),
      ])
    );

    logger.debug('Closing Chromium');
    await browser.close();

    response.status(200).json(Object.fromEntries(result));
  })
);

app.listen(3000, () => {
  logger.info('Priva Proxy listening on port 3000');
});

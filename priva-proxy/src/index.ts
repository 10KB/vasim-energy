import express from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import bodyParser from 'body-parser';
import asyncHandler from 'express-async-handler';
import { authenticatedSession, maybeScrape } from './services/playwright';
import { logger } from './utils/logger';

type RequestBody = {
  electricitySection?: string;
  electricityField?: string;

  waterSection?: string;
  waterField?: string;

  energySection?: string;
  energyField?: string;

  ventingSection?: string;
  returnTemperatureField?: string;
  flowTemperatureField?: string;
};

type ResponseBody = {
  electricity?: number | null;
  water?: number | null;
  energy?: number | null;
  venting?: {
    return: number | null;
    flow: number | null;
  } | null;
};

const app = express();
app.use(bodyParser.json());

app.post(
  '/api',
  asyncHandler<ParamsDictionary, ResponseBody, RequestBody>(async ({ body }, response) => {
    const { browser, page } = await authenticatedSession();

    const electricity = await maybeScrape(page, body.electricitySection, [body.electricityField]);
    const water = await maybeScrape(page, body.waterSection, [body.waterField]);
    const energy = await maybeScrape(page, body.energySection, [body.energyField]);
    const venting = await maybeScrape(page, body.ventingSection, [
      body.returnTemperatureField,
      body.flowTemperatureField,
    ]);

    logger.debug('Closing Chromium');
    await browser.close();

    response.status(200).json({
      electricity: electricity?.[0],
      water: water?.[0],
      energy: energy?.[0],
      venting: venting
        ? {
            return: venting[0],
            flow: venting[1],
          }
        : null,
    });
  })
);

app.listen(3000, () => {
  logger.info('Priva proxy listening on port 3000');
});

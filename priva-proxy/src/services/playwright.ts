import { BrowserContext, Page, chromium } from 'playwright-chromium';
import pRetry from 'p-retry';
import { logger } from '../utils/logger';
import { extractNumber } from '../utils/extract-number';
import fs from 'node:fs';

const step = async <C extends (page: Page) => Promise<T>, T>(
  page: Page,
  name: string,
  description: string,
  callback: C
): Promise<T | undefined> => {
  try {
    logger.debug(description);
    return await callback(page);
  } catch (error) {
    const path = `./logs/error-${name}-${new Date().toISOString()}.png`;
    logger.error(`${name} failed, writing screenshot to ${path}`);
    logger.error(error);
    await page.screenshot({ path, fullPage: true });
    return undefined;
  }
};

const AUTH_FILE_PATH = './.auth.json';

export const authenticatedSession = async () => {
  logger.debug('Starting Chromium');
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium-browser' });
  let context: BrowserContext;

  if (fs.existsSync(AUTH_FILE_PATH)) {
    logger.debug('Found stored authentication, attempting to use it');
    context = await browser.newContext({ storageState: AUTH_FILE_PATH });

    const page = await context.newPage();
    try {
      await page.goto('https://operator.priva.com');
      await page.waitForLoadState('networkidle');

      const isLoggedIn = await page.getByText('Verbruiksregistratie Elektra').isVisible()
        .catch(() => false);

      if (isLoggedIn) {
        logger.debug('Stored authentication is valid');
        return { browser, context, page };
      }

      logger.debug('Stored authentication expired, logging in again');
      await page.close();
    } catch (error) {
      logger.error('Error verifying authentication, will perform fresh login');
      logger.error(error);
      await page.close();
    }
  }

  context = await browser.newContext();
  const page = await context.newPage();

  await step(page, 'login', 'Loading login page', async (p) => {
    await p.goto('https://operator.priva.com');
    await p.waitForLoadState('networkidle');
  });

  await step(page, 'fill', 'Filling login credentials', async (p) => {
    await p.getByPlaceholder('Email Address').fill(process.env.EMAIL as string);
    await p.getByPlaceholder('Password').fill(process.env.PASSWORD as string);
    await p.getByRole('button', { name: 'Sign in' }).click();
  });

  await step(page, 'submit', 'Submitting login form', async (p) => {
    await p.waitForURL('https://operator.priva.com/**');
  });

  await page.context().storageState({ path: AUTH_FILE_PATH });

  return { browser, context, page };
};

export const scrapeData = async (
  context: BrowserContext,
  section: string,
  fields: string[]
): Promise<number[] | undefined> => {
  const page = await context.newPage();

  return step(page, 'scrape', `Scraping ${fields.join(', ')} from ${section}`, async (p) => {
    await p.goto(
      `https://operator.priva.com/scheme/e617c404-102f-4558-97a4-05f2b564dd40/p84628/${section}`
    );
    await p.waitForTimeout(3000);
    const results: number[] = [];

    for (const field of fields) {
      const scrape = async () => {
        const element = await p.locator(`g[data-id="${field}"] > text.scheme-datapoint__text`);
        const value = await element.innerHTML();
        if (!value || value === '-') {
          await p.waitForTimeout(3000);
          throw Error('Value not found');
        }
        logger.info(`Found ${value} for ${field}`);
        results.push(extractNumber(value));
      };

      await pRetry(scrape, {
        onFailedAttempt: (error) => {
          logger.debug(
            `Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`
          );
        },
      });
    }

    return results;
  });
};

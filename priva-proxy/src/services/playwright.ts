import { Page, chromium } from 'playwright-chromium';
import { logger } from '../utils/logger';
import { isPresent } from '../utils/is-present';
import { extractNumber } from '../utils/extract-number';

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

export const authenticatedSession = async () => {
  logger.debug('Starting Chromium');
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium-browser' });
  const context = await browser.newContext();
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

  return { browser, context, page };
};

export const scrapeData = async (
  page: Page,
  section: string,
  fields: string[]
): Promise<string[] | undefined> => {
  return step(page, 'scrape', `Scraping ${fields.join(', ')} from ${section}`, async (p) => {
    await p.goto(
      `https://operator.priva.com/scheme/e617c404-102f-4558-97a4-05f2b564dd40/p84628/${section}`
    );
    await p.waitForTimeout(3000);
    const results = [];

    for (const field of fields) {
      const element = await p.locator(`g[data-id="${field}"] > text.scheme-datapoint__text`);
      const value = await element.innerHTML();
      logger.debug(`Found ${value} for ${field}`);
      results.push(value);
    }

    return results;
  });
};

export const maybeScrape = async (
  page: Page,
  section: string | undefined,
  fields: Array<string | undefined>
) => {
  const presentFields = fields.filter(isPresent);
  if (!section || !presentFields) return null;

  const data = await scrapeData(page, section, presentFields);
  return data ? data.map(extractNumber) : null;
};

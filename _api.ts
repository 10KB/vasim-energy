import { chromium } from 'playwright-chromium';
import { logger } from './utils/logger';

const config = {
  email: process.env.EMAIL,
  password: process.env.PASSWORD,

  electricitySection: process.env.ELECTRICITY_SECTION,
  electricityField: process.env.ELECTRICITY_FIELD,

  waterSection: process.env.WATER_SECTION,
  waterField: process.env.WATER_FIELD,

  energySection: process.env.ENERGY_SECTION,
  energyField: process.env.ENERGY_FIELD,

  ventingSection: process.env.VENTING_SECTION,
  returnTemperatureField: process.env.RETURN_TEMPERATURE_FIELD,
  flowTemperatureField: process.env.FLOW_TEMPERATURE_FIELD,
};

async function run() {
  logger.info('Starting Chrome');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  logger.info('Logging in');
  await page.goto('https://operator.priva.com');
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder('Email Address').fill(config.email);
  await page.getByPlaceholder('Password').fill(config.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  try {
    await page.waitForURL('https://operator.priva.com/**');
  } catch (error) {
    const path = `./error-login-${new Date().toISOString()}.png`;
    await page.screenshot({ path, fullPage: true });
    logger.error(`Login failed, screenshot saved to ${path}`);
  }

  if (config.electricityField && config.electricityField !== '') {
    try {
      await page.goto(
        `https://operator.priva.com/scheme/e617c404-102f-4558-97a4-05f2b564dd40/p84628/${config.electricitySection}`
      );
      await page.waitForTimeout(3000);
      const electrityField = await page.locator(
        `g[data-id="${config.electricityField}"] > text.scheme-datapoint__text`
      );
      const electricity = Number.parseInt(
        (await electrityField.innerHTML()).replace(',', '').replace(' kWh', '')
      );
      logger.info(`Found electricity field: ${electricity}`);
    } catch (error) {
      const path = `./error-electricy-${new Date().toISOString()}.png`;
      await page.screenshot({ path, fullPage: true });
      logger.error(`Failed to scrape electricy, screenshot saved to ${path}`);
    }
  }

  if (config.waterField && config.waterField !== '') {
    try {
      await page.goto(
        `https://operator.priva.com/scheme/e617c404-102f-4558-97a4-05f2b564dd40/p84628/${config.waterSection}`
      );
      await page.waitForTimeout(3000);
      const waterField = await page.locator(
        `g[data-id="${config.waterField}"] > text.scheme-datapoint__text`
      );
      const water = Number.parseFloat(
        (await waterField.innerHTML()).replace(',', '').replace(' m3', '')
      );
      logger.info(`Found water field: ${water}`);
    } catch (error) {
      const path = `./error-water-${new Date().toISOString()}.png`;
      await page.screenshot({ path, fullPage: true });
      logger.error(`Failed to scrape water, screenshot saved to ${path}`);
    }
  }

  if (config.energyField && config.energyField !== '') {
    try {
      await page.goto(
        `https://operator.priva.com/scheme/e617c404-102f-4558-97a4-05f2b564dd40/p84628/${config.energySection}`
      );
      await page.waitForTimeout(3000);
      const energyField = await page.locator(
        `g[data-id="${config.energyField}"] > text.scheme-datapoint__text`
      );
      const energy = Number.parseFloat(
        (await energyField.innerHTML()).replace(',', '').replace(' kW.h', '')
      );
      logger.info(`Found energy field: ${energy}`);
    } catch (error) {
      const path = `./error-energy-${new Date().toISOString()}.png`;
      await page.screenshot({ path, fullPage: true });
      logger.error(`Failed to scrape energy, screenshot saved to ${path}`);
    }
  }

  if (config.ventingSection && config.ventingSection !== '') {
    try {
      await page.goto(
        `https://operator.priva.com/scheme/e617c404-102f-4558-97a4-05f2b564dd40/p84628/${config.ventingSection}`
      );
      await page.waitForTimeout(3000);

      const returnField = await page.locator(
        `g[data-id="${config.returnTemperatureField}"] > text.scheme-datapoint__text`
      );
      const returnTemperature = Number.parseFloat(await returnField.innerHTML());
      logger.info(`Found return temperature field: ${returnTemperature}`);

      const flowField = await page.locator(
        `g[data-id="${config.flowTemperatureField}"] > text.scheme-datapoint__text`
      );
      const flowTemperature = Number.parseFloat(await flowField.innerHTML());
      logger.info(`Found flow temperature field: ${flowTemperature}`);
    } catch (error) {
      console.error(error);
      const path = `./error-venting-${new Date().toISOString()}.png`;
      await page.screenshot({ path, fullPage: true });
      logger.error(`Failed to scrape venting, screenshot saved to ${path}`);
    }
  }

  await browser.close();
}

run();

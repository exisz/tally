/**
 * PLANET-1497 (S3.5) — Category editor UI.
 */
import { test, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp } from '../fixtures/electron-app';

test('S3.5 category editor: add, edit, delete, persist across reload', async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'tally-s3-5-'));
  const { app, page } = await launchApp({ tmpDataDir: dataDir, fakeWatchers: true });
  try {
    await page.getByRole('link', { name: /settings/i }).click();
    await page.getByRole('tab', { name: /categorization/i }).click();

    // Add
    await page.getByRole('button', { name: /add category/i }).click();
    await page.getByLabel(/name/i).fill('Coding');
    await page.getByLabel(/parent/i).selectOption('Work');
    await page.getByLabel(/regex/i).fill('VSCode|IntelliJ');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByRole('row', { name: /Work.*Coding.*VSCode\|IntelliJ/ })).toBeVisible();

    // Edit
    await page.getByRole('row', { name: /Coding/ }).getByRole('button', { name: /edit/i }).click();
    await page.getByLabel(/regex/i).fill('VSCode|IntelliJ|Zed');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByRole('row', { name: /VSCode\|IntelliJ\|Zed/ })).toBeVisible();

    // Reload → still there
    await page.reload();
    await page.getByRole('link', { name: /settings/i }).click();
    await page.getByRole('tab', { name: /categorization/i }).click();
    await expect(page.getByRole('row', { name: /VSCode\|IntelliJ\|Zed/ })).toBeVisible();

    // Delete
    await page.getByRole('row', { name: /Coding/ }).getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();
    await expect(page.getByRole('row', { name: /Coding/ })).toHaveCount(0);
  } finally {
    await app.close();
  }
});

import { expect, test, type Page } from "@playwright/test";

const signInAsStudentAndOpenOffers = async (page: Page) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Lucas Dupont", exact: true }).click();
  await expect(page.getByText("Lucas Dupont", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Offres", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Offres de stage" })).toBeVisible();
};

const expectStudentOffersToBePublished = async (page: Page) => {
  const rows = page.getByRole("table").getByRole("row");
  await expect(rows.first()).toBeVisible();

  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(1);

  for (let index = 1; index < rowCount; index += 1) {
    await expect(rows.nth(index).getByRole("cell").nth(4)).toHaveText("Publiée");
  }
};

test("scénario 1 — Recherche avec résultat", async ({ page }) => {
  await signInAsStudentAndOpenOffers(page);
  await expectStudentOffersToBePublished(page);

  await page.getByRole("searchbox", { name: "Rechercher par titre" }).fill("API REST");

  const matchingOffer = page.getByRole("row", { name: /API REST de facturation/ });
  await expect(matchingOffer).toBeVisible();
  await expect(
    matchingOffer.getByRole("cell", { name: "Publiée", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(2);
});

test("scénario 2 — Recherche sans résultat", async ({ page }) => {
  await signInAsStudentAndOpenOffers(page);
  await expectStudentOffersToBePublished(page);

  await page
    .getByRole("searchbox", { name: "Rechercher par titre" })
    .fill("titre inexistant");

  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(
    page.getByText("Aucune offre ne correspond à la recherche.", { exact: true }),
  ).toBeVisible();
});

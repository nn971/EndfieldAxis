import { expect, test, type Page } from "playwright/test";

type FreezeWindowSnapshot = {
  kind: "combo" | "ultimate";
  left: number;
  width: number;
};

type BarSnapshot = {
  left: number;
  width: number;
};

async function setEnglish(page: Page) {
  const enButton = page.getByTestId("lang-en").first();
  if ((await enButton.count()) > 0) {
    await enButton.click();
  }
}

async function dragSkillToFrame(params: {
  page: Page;
  skillType: "normalAttack" | "normalSkill" | "comboSkill" | "ultimate";
  frame: number;
  laneIndex?: 0 | 1 | 2 | 3;
}) {
  const { page, skillType, frame, laneIndex = 0 } = params;
  const tab = page.getByTestId(`axis-skilltab-${skillType}`);
  const laneLabel = page.getByTestId(`axis-lane-label-${laneIndex}`);
  const zeroSecondMark = page.getByText("0s").first();

  await expect(tab).toBeVisible();
  await expect(laneLabel).toBeVisible();
  await expect(zeroSecondMark).toBeVisible();

  const tabBox = await tab.boundingBox();
  const laneBox = await laneLabel.boundingBox();
  const zeroBox = await zeroSecondMark.boundingBox();
  if (!tabBox || !laneBox || !zeroBox) {
    throw new Error("Could not read skill tab, lane label, or axis mark bounds.");
  }

  const startX = tabBox.x + tabBox.width / 2;
  const startY = tabBox.y + tabBox.height / 2;
  const axisOriginX = zeroBox.x - 4;
  const dropX = axisOriginX + frame;
  const dropY = laneBox.y + laneBox.height / 2;
  const pointerId = 1;

  await tab.evaluate(node => {
    const el = node as HTMLElement;
    el.setPointerCapture = () => {};
    el.releasePointerCapture = () => {};
  });

  await tab.dispatchEvent("pointerdown", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: startX,
    clientY: startY,
  });
  await page.waitForTimeout(50);

  await tab.dispatchEvent("pointermove", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: dropX,
    clientY: dropY,
  });
  await page.waitForTimeout(50);

  await tab.dispatchEvent("pointerup", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: dropX,
    clientY: dropY,
  });
}

async function readFreezeWindows(page: Page): Promise<FreezeWindowSnapshot[]> {
  return page.locator('[data-testid="axis-freeze"]').evaluateAll(elements =>
    elements
      .map(element => {
        const node = element as HTMLElement;
        const kind = node.getAttribute("data-kind");
        const left = Number.parseFloat(node.style.left || "NaN");
        const width = Number.parseFloat(node.style.width || "NaN");
        if ((kind !== "combo" && kind !== "ultimate") || !Number.isFinite(left) || !Number.isFinite(width)) {
          return null;
        }
        return { kind, left, width };
      })
      .filter((window): window is FreezeWindowSnapshot => window !== null)
      .sort((a, b) => a.left - b.left),
  );
}

async function readBars(page: Page): Promise<BarSnapshot[]> {
  return page.locator('div[style*="height: 8px"]').evaluateAll(elements =>
    elements
      .map(element => {
        const node = element as HTMLElement;
        const left = Number.parseFloat(node.style.left || "NaN");
        const width = Number.parseFloat(node.style.width || "NaN");
        if (!Number.isFinite(left) || !Number.isFinite(width)) {
          return null;
        }
        return { left, width };
      })
      .filter((bar): bar is BarSnapshot => bar !== null)
      .sort((a, b) => a.left - b.left),
  );
}

test.describe.skip("freeze mechanics e2e", () => {
  test("ultimate freeze blocks all casts", async ({ page }) => {
    await page.goto("/");
    await setEnglish(page);

    const ultimateBoxes = page.locator('[data-testid="axis-skillbox"][data-skill-type="ultimate"]');
    const normalAttackBoxes = page.locator('[data-testid="axis-skillbox"][data-skill-type="normalAttack"]');

    const initialUltimateCount = await ultimateBoxes.count();
    await dragSkillToFrame({ page, skillType: "ultimate", frame: 60, laneIndex: 0 });
    await expect(ultimateBoxes).toHaveCount(initialUltimateCount + 1);

    const initialNormalAttackCount = await normalAttackBoxes.count();
    await dragSkillToFrame({ page, skillType: "normalAttack", frame: 100, laneIndex: 0 });
    await expect(normalAttackBoxes).toHaveCount(initialNormalAttackCount);

    const freezeWindows = await readFreezeWindows(page);
    const ultimateWindow = freezeWindows.find(window => window.kind === "ultimate");
    expect(ultimateWindow).toBeTruthy();
    expect(ultimateWindow!.left).toBe(60);
    expect(ultimateWindow!.width).toBe(120);
  });

  test("combo freeze blocks normal casts but allows ultimate interrupt", async ({ page }) => {
    await page.goto("/");
    await setEnglish(page);

    const comboBoxes = page.locator('[data-testid="axis-skillbox"][data-skill-type="comboSkill"]');
    const ultimateBoxes = page.locator('[data-testid="axis-skillbox"][data-skill-type="ultimate"]');
    const normalSkillBoxes = page.locator('[data-testid="axis-skillbox"][data-skill-type="normalSkill"]');

    const initialComboCount = await comboBoxes.count();
    await dragSkillToFrame({ page, skillType: "comboSkill", frame: 120, laneIndex: 0 });
    await expect(comboBoxes).toHaveCount(initialComboCount + 1);

    const initialUltimateCount = await ultimateBoxes.count();
    await dragSkillToFrame({ page, skillType: "ultimate", frame: 150, laneIndex: 0 });
    await expect(ultimateBoxes).toHaveCount(initialUltimateCount + 1);

    const initialNormalSkillCount = await normalSkillBoxes.count();
    await dragSkillToFrame({ page, skillType: "normalSkill", frame: 160, laneIndex: 0 });
    await expect(normalSkillBoxes).toHaveCount(initialNormalSkillCount);

    const freezeWindows = await readFreezeWindows(page);
    expect(freezeWindows).toEqual([
      { kind: "combo", left: 120, width: 30 },
      { kind: "ultimate", left: 150, width: 120 },
    ]);

    await page.getByTestId("sim-run").click();
    const simLogText = (await page.getByTestId("sim-log").textContent()) ?? "";

    expect(simLogText).toMatch(/\n\s*120 \[ACT\].*comboSkill/i);
    expect(simLogText).toMatch(/\n\s*150 \[ACT\].*ultimate/i);
    expect(simLogText).not.toMatch(/\n\s*160 \[ACT\].*normalSkill/i);
  });

  test("buff bars extend in real-time when freeze is active", async ({ page }) => {
    const getEarliestBarWidth = async () => {
      const bars = await readBars(page);
      if (bars.length === 0) {
        throw new Error("Expected at least one render bar after simulation.");
      }
      return bars[0].width;
    };

    await page.goto("/");
    await setEnglish(page);
    await dragSkillToFrame({ page, skillType: "normalSkill", frame: 20, laneIndex: 0 });
    await page.getByTestId("sim-run").click();
    const widthWithoutFreeze = await getEarliestBarWidth();

    await page.goto("/");
    await setEnglish(page);
    await dragSkillToFrame({ page, skillType: "normalSkill", frame: 20, laneIndex: 0 });
    await dragSkillToFrame({ page, skillType: "ultimate", frame: 40, laneIndex: 0 });
    await page.getByTestId("sim-run").click();
    const widthWithFreeze = await getEarliestBarWidth();

    expect(widthWithFreeze).toBeGreaterThan(widthWithoutFreeze);
  });
});

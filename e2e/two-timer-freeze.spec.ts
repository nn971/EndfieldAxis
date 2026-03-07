import { expect, test, type Page } from "playwright/test";

type FreezeWindowSnapshot = {
  kind: "combo" | "ultimate";
  left: number;
  width: number;
};

type RenderBuffBar = {
  type: string;
  effectId: string;
  startFrame: number;
  width: number;
};


async function setEnglish(page: Page) {
  const enButton = page.getByTestId("lang-en").first();
  if ((await enButton.count()) > 0) {
    await enButton.click();
  }
}

async function tryAddSkillBox(params: {
  page: Page;
  skillType: "normalAttack" | "normalSkill" | "comboSkill" | "ultimate";
  frame: number;
  laneIndex?: 0 | 1 | 2 | 3;
}) {
  const { page, skillType, frame, laneIndex = 0 } = params;
  return page.evaluate(
    async ({ laneIndex, skillType, frame }) => {
      const dynamicImport = new Function(
        "path",
        "return import(path)",
      ) as (path: string) => Promise<any>;
      const [{ store }, { skillBoxAdded }, { buildFreezeTimeline }, { getCastStartFreezeFrames }] =
        await Promise.all([
          dynamicImport("/src/app/store.ts"),
          dynamicImport("/src/features/solution/solutionSlice.ts"),
          dynamicImport("/src/shared/simTime/freezeTimeline.ts"),
          dynamicImport("/src/shared/simTime/freezeConfig.ts"),
        ]);

      const state = store.getState();
      const teamOperatorIds = state.solution.teamOperatorIds as string[];
      const operatorId = teamOperatorIds[laneIndex] ?? null;
      if (!operatorId) return false;

      const existing = state.solution.skillBoxes;
      const probeId = "e2e_probe_skillbox";
      const freezeTimeline = buildFreezeTimeline(
        [
          ...existing,
          {
            id: probeId,
            operatorId,
            skillType,
            startFrame: frame,
            durationFrames: 1,
          },
        ],
        getCastStartFreezeFrames,
      );

      store.dispatch(
        skillBoxAdded({
          operatorId,
          skillType,
          startFrame: frame,
        }),
      );
      return true;
    },
    { laneIndex, skillType, frame },
  );
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

test.describe("freeze mechanics e2e", () => {
  test("ultimate freeze blocks all casts", async ({ page }) => {
    await page.goto("/");
    await setEnglish(page);

    const ultimateBoxes = page.locator('[data-testid="axis-skillbox"][data-skill-type="ultimate"]');
    const normalAttackBoxes = page.locator('[data-testid="axis-skillbox"][data-skill-type="normalAttack"]');

    const initialUltimateCount = await ultimateBoxes.count();
    const didAddUltimate = await tryAddSkillBox({ page, skillType: "ultimate", frame: 60, laneIndex: 0 });
    expect(didAddUltimate).toBe(true);
    await expect(ultimateBoxes).toHaveCount(initialUltimateCount + 1);

    const initialNormalAttackCount = await normalAttackBoxes.count();
    await tryAddSkillBox({
      page,
      skillType: "normalAttack",
      frame: 100,
      laneIndex: 0,
    });
    // Box is added but marked as strict invalid
    await expect(normalAttackBoxes).toHaveCount(initialNormalAttackCount + 1);
    const invalidNormalAttack = normalAttackBoxes.locator('[data-invalid-kind="strict"]').first();
    await expect(invalidNormalAttack).toBeVisible();

    // Run simulation and verify the invalid cast is dismissed (no ACT log)
    await page.getByTestId("sim-run").click();
    const simLogText = (await page.getByTestId("sim-log").textContent()) ?? "";
    expect(simLogText).not.toMatch(/\n\s*100\s+\[ACT\].*normalAttack/i);

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
    const didAddCombo = await tryAddSkillBox({
      page,
      skillType: "comboSkill",
      frame: 120,
      laneIndex: 0,
    });
    expect(didAddCombo).toBe(true);
    await expect(comboBoxes).toHaveCount(initialComboCount + 1);

    const initialUltimateCount = await ultimateBoxes.count();
    const didAddUltimate = await tryAddSkillBox({ page, skillType: "ultimate", frame: 150, laneIndex: 0 });
    expect(didAddUltimate).toBe(true);
    await expect(ultimateBoxes).toHaveCount(initialUltimateCount + 1);

    const initialNormalSkillCount = await normalSkillBoxes.count();
    await tryAddSkillBox({
      page,
      skillType: "normalSkill",
      frame: 160,
      laneIndex: 0,
    });
    await expect(normalSkillBoxes).toHaveCount(initialNormalSkillCount + 1);
    const invalidNormalSkill = normalSkillBoxes.locator('[data-invalid-kind="strict"]').first();
    await expect(invalidNormalSkill).toBeVisible();

    const freezeWindows = await readFreezeWindows(page);
    expect(freezeWindows).toEqual([
      { kind: "combo", left: 120, width: 30 },
      { kind: "ultimate", left: 150, width: 120 },
    ]);

    await page.getByTestId("sim-run").click();
    const simLogText = (await page.getByTestId("sim-log").textContent()) ?? "";

    expect(simLogText).toMatch(/\n\s*120 \[ACT\].*comboSkill/i);
    expect(simLogText).toMatch(/\n\s*\d+ \[ACT\].*ultimate/i);
    expect(simLogText).not.toMatch(/\n\s*160 \[ACT\].*normalSkill/i);
  });

  test("buff bars extend in real-time when freeze is active", async ({ page }) => {
    const readBuffBars = async (): Promise<RenderBuffBar[]> => {
      return page.evaluate(async () => {
        const dynamicImport = new Function(
          "path",
          "return import(path)",
        ) as (path: string) => Promise<any>;
        const { store } = await dynamicImport("/src/app/store.ts");
        return store
          .getState()
          .solution.simRenderCache.bars.map(
            (bar: {
              type: string;
              effectId: string;
              startFrame: number;
              endFrame: number;
            }) => ({
              type: bar.type,
              effectId: bar.effectId,
              startFrame: bar.startFrame,
              width: bar.endFrame - bar.startFrame,
            }),
          );
      });
    };

    await page.goto("/");
    await setEnglish(page);
    const didAddBaseNormalSkill = await tryAddSkillBox({
      page,
      skillType: "normalSkill",
      frame: 20,
      laneIndex: 0,
    });
    expect(didAddBaseNormalSkill).toBe(true);
    await page.getByTestId("sim-run").click();
    const barsWithoutFreeze = await readBuffBars();
    expect(barsWithoutFreeze.length).toBeGreaterThan(0);

    await page.goto("/");
    await setEnglish(page);
    const didAddNormalSkill = await tryAddSkillBox({
      page,
      skillType: "normalSkill",
      frame: 20,
      laneIndex: 0,
    });
    const didAddUltimate = await tryAddSkillBox({ page, skillType: "ultimate", frame: 80, laneIndex: 0 });
    expect(didAddNormalSkill).toBe(true);
    expect(didAddUltimate).toBe(true);
    await page.getByTestId("sim-run").click();
    const barsWithFreeze = await readBuffBars();

    const baselineByKey = new Map(
      barsWithoutFreeze.map((bar: RenderBuffBar) => [
        `${bar.type}:${bar.effectId}:${bar.startFrame}`,
        bar.width,
      ]),
    );
    const extendedBars = barsWithFreeze.filter((bar: RenderBuffBar) => {
      const baselineWidth = baselineByKey.get(
        `${bar.type}:${bar.effectId}:${bar.startFrame}`,
      );
      return baselineWidth != null && bar.width > baselineWidth;
    });

    expect(extendedBars.length).toBeGreaterThan(0);
  });

  test("soft invalid shows after running simulation", async ({ page }) => {
    await page.goto("/");
    await setEnglish(page);

    const ultimateBoxes = page.locator('[data-testid="axis-skillbox"][data-skill-type="ultimate"]');

    await tryAddSkillBox({ page, skillType: "ultimate", frame: 0, laneIndex: 0 });
    await expect(ultimateBoxes).toHaveCount(1);

    await page.getByTestId("sim-run").click();

    const invalidUltimate = ultimateBoxes.locator('[data-invalid-kind="soft"]').first();
    await expect(invalidUltimate).toBeVisible();

    const reasons = await invalidUltimate.getAttribute("data-invalid-reasons");
    expect(reasons).toContain("soft:insufficient-ultimate-energy");
  });
});

import { zhCNContent } from "./content/zh-CN-content";

export const zhCN = {
  translation: {
    common: {
      replace: "替换",
      newTab: "新建标签页",
    },
    app: {
      title: "终末地轴",
    },
    content: zhCNContent,
    axis: {
      title: "轴编辑器",
      placeholder: "这是 Axis 编辑器组件的占位内容。",
      addSkillTooltip: "拖入时间轴以添加技能框",
      enemyLane: "敌人",
      controlledBadge: "操控中",
      delete: "删除",
      skillTabs: {
        normalAttack: "普通攻击",
        normalSkill: "战技",
        comboSkill: "连携技",
        ultimate: "终结技",
      },
    },
    solutionSL: {
      heading: "方案保存/加载",
      helperText: "导出/导入可序列化的方案 JSON。",
      exportToText: "导出为文本",
      loadFromText: "从文本加载",
      downloadJson: "下载 .json",
      uploadJson: "上传 .json",
      pasteJsonFirst: "请先粘贴 JSON",
      saveToBrowser: "保存到浏览器",
      loadFromBrowser: "从浏览器加载",
      errorPrefix: "错误：",
      textareaPlaceholder: "点击'导出为文本'或在此处粘贴方案 JSON...",
      errors: {
        invalid_json: "无效 JSON（解析失败）。",
        not_object: "方案必须是 JSON 对象。",
        unsupported_version:
          "不支持的方案版本 {{version}}（期望 {{expectedVersion}}）。",
        missing_version: "Solution.version 必须是数字。",
        invalid_team_ids: "Solution.teamOperatorIds 必须是长度为 4 的数组。",
        invalid_skill_boxes: "Solution.skillBoxes 包含无效条目。",
        invalid_build_map: "Solution.buildByOperatorId 必须是对象映射。",
        missing_build_entry:
          "缺少 operatorId 为 {{operatorId}} 的 buildByOperatorId 条目。",
        failedWriteLocalStorage: "写入 localStorage 失败。",
        failedReadLocalStorage: "读取 localStorage 失败。",
        noSavedSolutionLocalStorage: "localStorage 中未找到已保存的方案。",
        failedReadFile: "读取文件失败。",
      },
    },
    devTest: {
      heading: "开发测试面板",
      helperText: "从当前方案生成并对比模拟器标准。",

      generateStandard: "生成标准",
      compareCurrent: "对比当前",
      downloadJson: "下载 .json",
      uploadJson: "上传 .json",
      saveToBrowser: "保存到浏览器",
      loadFromBrowser: "从浏览器加载",

      compareModeLabel: "对比模式：",
      modeEventTypes: "事件类型",
      modeHitDamage: "命中伤害",
      modeStagger: "硬直",

      tooltipNeedJson: "请先生成或粘贴测试用例 JSON",

      errorLabel: "错误",
      errorFailedGenerateFromSolution: "从当前方案生成测试用例失败。",
      errorFailedRunSimulationForComparison: "运行模拟进行对比失败。",
      errorNoTextToDownload: "没有可下载的测试用例文本。",
      errorNoTextToSave: "没有可保存的测试用例文本。",
      errorFailedWriteLocalStorage: "写入 localStorage 失败。",
      errorFailedReadLocalStorage: "读取 localStorage 失败。",
      errorNoSavedInLocalStorage: "localStorage 中未找到已保存的测试用例。",
      errorFailedReadFile: "读取文件失败。",
      errors: {
        invalid_json: "无效 JSON（解析失败）。",
        not_object: "测试用例必须是 JSON 对象。",
        unsupported_version:
          "不支持的测试用例版本 {{version}}（期望 {{expectedVersion}}）。",
        missing_solution: "测试用例中的 solution 缺失或无效。",
        missing_expected: "测试用例中的 expected 部分缺失。",
        invalid_eventTypes: "expected.eventTypes 必须是字符串数组。",
        invalid_hitBuckets:
          "expected.hitDamageBuckets 必须是包含完整 bucket 值的命中快照数组。",
        invalid_staggerSeries:
          "expected.enemyStaggerSeries 必须是包含 frame、seq、value 的点数组。",
        event_count_mismatch:
          "事件数量不匹配：期望 {{expected}}，实际 {{actual}}。",
        event_mismatch:
          "事件在索引 {{index}} 处不匹配：期望 {{expected}}，实际 {{actual}}。",
        hit_count_mismatch:
          "命中数量不匹配：期望 {{expected}}，实际 {{actual}}。",
        hit_mismatch:
          "命中在索引 {{index}} 处不匹配（{{field}}）：期望 {{expected}}，实际 {{actual}}。",
        stagger_count_mismatch:
          "敌人硬直点数量不匹配：期望 {{expected}}，实际 {{actual}}。",
        stagger_mismatch:
          "敌人硬直在索引 {{index}} 处不匹配（{{field}}）：期望 {{expected}}，实际 {{actual}}。",
        pass: "通过：{{mode}} 模式下共有 {{count}} 项匹配。",
      },

      resultGeneratedStandard:
        "已生成标准：{{events}} 个事件，{{hitSnapshots}} 个命中快照，{{staggerPoints}} 个硬直点。",
      resultLoadedFromFile: "已从文件加载测试用例。",
      resultSavedToLocalStorage: "已将测试用例保存到 localStorage。",
      resultLoadedFromLocalStorage: "已从 localStorage 加载测试用例。",

      textareaPlaceholder: "生成标准或在此粘贴测试用例 JSON...",
      downloadFilename: "sim-test-case.json",
    },
    damageStats: {
      heading: "伤害统计",
      lastRunWithHits: "上次运行：{{count}} 次命中",
      lastRunEmpty: "上次运行：-",
      totalDamage: "总伤害",
      clickRun: "（点击 Run）",
      watches: "监视项",
      addWatch: "添加监视",
      noWatches: "暂无监视项。点击“添加监视”以追踪筛选后的伤害。",
      watchName: "监视 {{index}}",
      deleteWatch: "删除监视",
      anyOperator: "任意干员",
      anySkill: "任意技能",
      anyType: "任意类型",
      damageLabel: "伤害",
      hitsLabel: "命中",
      skillTypes: {
        normalAttack: "普通攻击",
        normalSkill: "战技",
        comboSkill: "连携技",
        ultimate: "终结技",
      },
      damageTypes: {
        physical: "物理",
        heat: "热",
        electric: "电",
        cryo: "冰",
        nature: "自然",
      },
    },
    operator: {
      buildPreview: "构建预览",
      show: "显示",
      hide: "隐藏",
      showRestStatBreakdown: "显示 restStat 明细",
      atk: "攻击",
      base: "基础",
      final: "最终",
      op: "角色",
      weapon: "武器",
      staticDamageBuckets: "静态伤害桶",
      atIncRatio: "atIncRatio",
      atkIncFlat: "atkIncFlat",
      attributes: "属性",
      contributorsRestStatLog: "贡献项（restStat.log）",
      noEntries: "暂无条目。",
      operatorPicker: "角色选择器",
      selectOperator: "选择角色",
      close: "关闭",
      inLane: "在第 {{lane}} 路",
      tabOperator: "角色",
      tabWeapon: "武器",
      tabGears: "装备",
      unknownOperator: "未知角色：{{operatorId}}",
      controlled: "已操控",
      setControlled: "设为操控",
      clickToChangeOperator: "点击更换角色",
      noAvatar: "无头像",
      operator: "角色",
      clickAvatarToChange: "点击头像更换",
    },
    sim: {
      heading: "模拟器",
      consoleStyleLog: "控制台风格模拟日志",
      status: "轴：{{skillBoxes}} 个技能框 | 队伍：{{team}}",
      clear: "清空",
      run: "运行",
      clickRun: "（点击 Run）",
      finalWorldState: "最终世界状态：",
    },
    simLog: {
      sim_start: "模拟开始。",
      sim_end: "模拟结束。",
      sim_abort_max_steps: "模拟已中止：达到最大步数（{{maxSteps}}）。",
      dev_dismiss_event_when_mismatch:
        "丢弃事件 {{eventType}}（{{eventId}}）：{{reason}}。",
      dev_warn_unknown_event: "未知事件类型：{{eventType}}。",
      act_cast_illegal_combo:
        "{{sourceDisplayName}} 无法施放 {{skillType}}（连携非法）：{{reason}}。",
      act_cast_start:
        "{{sourceDisplayName}} 开始施放 {{skillType}}，目标 {{targetDisplayName}}。",
      act_cast_end:
        "{{sourceDisplayName}} 结束施放 {{skillType}}，目标 {{targetDisplayName}}。",
      act_cast_insufficient_sp:
        "{{sourceDisplayName}} SP 不足（已消耗 {{spent}} / 需求 {{cost}}）。",
      act_cast_insufficient_ultimate:
        "{{sourceDisplayName}} 终结能量不足（已消耗 {{spent}} / 需求 {{cost}}）。",
      act_combo_triggered: "{{sourceDisplayName}} 触发连携状态。",
      act_combo_elapsed: "{{sourceDisplayName}} 连携状态结束。",
      act_team_sp_recover:
        "{{sourceDisplayName}} 恢复队伍 SP +{{gained}}（真实 {{real}}，虚值 {{fake}}）。",
      act_team_sp_return:
        "{{sourceDisplayName}} 返还队伍 SP +{{gained}}（真实 {{real}}，虚值 {{fake}}）。",
      act_ultimate_gain_combo_hit:
        "{{sourceDisplayName}} 因连携命中获得终结能量 +{{gained}}。",
      act_team_ultimate_gain_normal_skill_final_hit:
        "队伍因战技终击获得终结能量 +{{gained}}（realSpRatio={{realSpRatio}}）。",
      dmg_hit:
        "{{sourceDisplayName}} 对 {{targetDisplayName}} 造成 {{amount}} 伤害（剩余 HP {{hpLeft}}）。",
      buff_apply: "对 {{targetDisplayName}} 施加 Buff {{buffId}}。",
      buff_refresh: "刷新 {{targetDisplayName}} 的 Buff {{buffId}}。",
      buff_stack_change:
        "{{targetDisplayName}} 的 Buff {{buffId}} 层数变化：{{before}} -> {{after}}。",
      buff_expire: "{{targetDisplayName}} 的 Buff {{buffId}} 到期。",
      buff_removed: "{{targetDisplayName}} 的 Buff {{buffId}} 被移除。",
      buff_vulnerable_consumed:
        "{{targetDisplayName}} 的 {{statusType}} 消耗 {{consumed}} 层。",
      infliction_stack_change:
        "{{targetDisplayName}} 的异常 {{inflictionType}} 层数变化：{{before}} -> {{after}}。",
      infliction_expire:
        "{{targetDisplayName}} 的异常 {{inflictionType}} 到期。",
      reaction_triggered:
        "{{targetDisplayName}} 触发反应 {{reactionBuffId}}（消耗术蚀层数：{{consumedArtsStacks}}）。",
      reaction_consumed_inflictions:
        "{{targetDisplayName}} 的反应 {{reactionBuffId}} 消耗异常（消耗术蚀层数：{{consumedArtsStacks}}）。",
      dmg_breakdown_attack:
        "基础攻击 {{baseAttack}} + 武器 {{weaponAttack}}，攻击加成 {{atkIncRatio}}，属性加成 {{attributeBonusRatio}}，最终攻击 {{atkFinal}}。",
      dmg_breakdown_raw: "原始输出 {{rawOutcoming}}，原始伤害 {{rawDamage}}。",
      dmg_breakdown_multiplier_header: "最终乘区 {{dmgFinalMultiplier}}，来源如下：",
      dmg_breakdown_bonus_line: "bucket={{bucket}}，+{{addValue}}，{{note}}",
    },
  },
} as const;

const rawContent = $resource.content;

// 1. 执行转换
rawContent = shadowrocketToQuantumultX(rawContent);
$done({ content: rawContent });

function shadowrocketToQuantumultX(content) {
    if (!content) return "";

    // --- 配置区 ---
    const DEFAULT_POLICY = "Proxy";
    const TYPE_MAP = {
        "DOMAIN": "HOST",
        "DOMAIN-SUFFIX": "HOST-SUFFIX",
        "DOMAIN-KEYWORD": "HOST-KEYWORD",
        "IP-CIDR": "IP-CIDR",
        "IP-CIDR6": "IP-CIDR6",
        "USER-AGENT": "USER-AGENT"
    };

    // --- 逻辑区 ---
    
    // 阶段一：清洗与初筛 (Filter)
    const validLines = content.split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => {
            if (!line) return false;
            // 排除注释行，但保留在结果里可以用 push(line) 的思路，
            // 这里我们按照 Parser 逻辑只保留有效规则
            return !line.startsWith("#") && !line.startsWith(";") && !line.startsWith("//");
        });

    // 阶段二：格式化转换 (Map)
    const convertedLines = validLines.map(line => {
        // 使用逗号切分，并清理每个片段
        const parts = line.split(",").map(item => item.trim());
        
        // 核心防御：非规则行不处理
        if (parts.length < 2) return line;

        // 解构赋值：[类型, 目标, 策略, ...其他参数]
        let [rawType, target, policy, ...others] = parts;

        // 1. 类型转换：从映射表取值，取不到则保持原样
        const type = TYPE_MAP[rawType.toUpperCase()] || rawType.toUpperCase();

        // 2. 策略补全：如果原规则没写策略，则使用默认策略
        const finalPolicy = policy || DEFAULT_POLICY;

        // 3. 额外参数处理 (如 no-resolve)
        // 检查原行或 others 数组中是否包含 no-resolve
        let extraParams = others.length > 0 ? `,${others.join(",")}` : "";
        
        // 特殊修正：针对 IP-CIDR 类型，如果原行有 no-resolve 但没被捕获到 others 里
        if (type.startsWith("IP-CIDR") && 
            line.toLowerCase().includes("no-resolve") && 
            !extraParams.toLowerCase().includes("no-resolve")) {
            extraParams += ",no-resolve";
        }

        // 拼接标准 QX 格式：类型,目标,策略[,额外参数]
        return `${type},${target},${finalPolicy}${extraParams}`;
    });

    return convertedLines.join("\n");
}

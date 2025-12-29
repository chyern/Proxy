let rawContent = $resource.content;

rawContent = transition(rawContent);

$done({ content: rawContent });

function transition(content) {
    if (!content) return "";

    return content
        .split(/\r?\n/)
        .filter(line => {
            const trimmed = line.trim();
            if (trimmed === "") return false;
            if (
                trimmed.startsWith("#") || 
                trimmed.startsWith(";") || 
                trimmed.startsWith("//")
            ) {
                return false;
            }
            return true;
        })
        .map(line => {
            let processedLine = line;
            processedLine = shadowrocketToQuantumultX(processedLine);
            return processedLine;
        })
        .join("\n");
}

function shadowrocketToQuantumultX(line) {
    // 1. 在方法内部定义映射表
    const typeMap = {
        "DOMAIN-SUFFIX": "HOST-SUFFIX",
        "DOMAIN": "HOST",
        "DOMAIN-WILDCARD": "HOST-WILDCARD",
        "DOMAIN-KEYWORD": "HOST-KEYWORD",
        "IP-CIDR": "IP-CIDR",
        "IP-CIDR6": "IP6-CIDR"
    };

    // 2. 按逗号切分并清理空格
    let parts = line.split(",").map(p => p.trim());
    
    let type = parts[0];
    let value = parts[1];
    let policy = parts[2];

    // 3. 转换类型字段：如果在映射表里就替换
    if (typeMap[type.toUpperCase()]) {
        type = typeMap[type];
    } else {
        return "";
    }

    // 4. 补全策略：如果没有策略字段，则默认为 PROXY
    if (!policy) {
        policy = "PROXY";
    }

    // 5. 重新组合返回
    return `${type},${value},${policy}`;
}

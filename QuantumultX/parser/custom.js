const content = $resource.content;

function main() {
    if (!content) {
        $done({ error: "未能读取到内容" });
        return;
    }

    let lines = content.split(/\r?\n/);
    
    let processedLines = lines.map(item => {
        let line = item.trim();

        // 1. 过滤空行和注释
        if (line === "" || line.startsWith("#") || line.startsWith(";")) {
            return item; 
        }

        // 2. 独立 if 判断开头 (i 忽略大小写)
        
        // 匹配 DOMAIN-SUFFIX 开头
        if (/^DOMAIN-SUFFIX/i.test(line)) {
            item = item.replace(/DOMAIN-SUFFIX/i, "HOST-SUFFIX");
        } 
        
        // 匹配 DOMAIN-KEYWORD 开头
        if (/^DOMAIN-KEYWORD/i.test(line)) {
            item = item.replace(/DOMAIN-KEYWORD/i, "HOST-KEYWORD");
        } 
        
        // 匹配 DOMAIN 开头
        // 注意：为避免误匹配 DOMAIN-SUFFIX，这里正则加了逗号边界或行尾判断
        if (/^DOMAIN,/i.test(line) || /^DOMAIN$/i.test(line)) {
            item = item.replace(/DOMAIN/i, "HOST");
        }

        return item;
    });

    $done({ content: processedLines.join("\n") });
}

main();

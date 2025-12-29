const content = $response.body;

function main() {
    if (!content) {
        $done({ 
            body: "", 
            headers: { 'content-type': 'text/plain; charset=utf-8' }
        });
        return;
    }

    let lines = content.split(/\r?\n/);
    
    let processedLines = lines.map(item => {
        let line = item.trim();

        // 1. 过滤空行和注释
        if (line === "" || line.startsWith("#") || line.startsWith(";")) {
            return item; // 返回原始行，保留缩进
        }

        // 2. 精确匹配和替换（按优先级排序）
        
        // 优先匹配 DOMAIN-SUFFIX（完整匹配）
        if (/^DOMAIN-SUFFIX,/i.test(line)) {
            return line.replace(/^DOMAIN-SUFFIX,/i, 'HOST-SUFFIX,');
        } 
        
        // 匹配 DOMAIN-KEYWORD（完整匹配）
        if (/^DOMAIN-KEYWORD,/i.test(line)) {
            return line.replace(/^DOMAIN-KEYWORD,/i, 'HOST-KEYWORD,');
        } 
        
        // 匹配 DOMAIN（仅限逗号结尾的情况，避免与 SUFFIX/KEYWORD 冲突）
        if (/^DOMAIN,/i.test(line)) {
            return line.replace(/^DOMAIN,/i, 'HOST,');
        }
        
        // 如果是单独的 DOMAIN 规则（无逗号，较少见）
        if (/^DOMAIN$/i.test(line)) {
            return line.replace(/^DOMAIN$/i, 'HOST');
        }

        // 3. 其他情况保持原样
        return item; // 返回原始行，保留格式
    });

    $done({
        body: processedLines.join("\n"),
        headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'max-age=3600'
        }
    });
}

main();

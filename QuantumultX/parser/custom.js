/**
 * Quantumult X 资源解析器 - 独立 if 判断版
 */

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
            return line; 
        }

        // 2. 独立 if 判断开头 (i 忽略大小写)
        
        // 匹配 DOMAIN-SUFFIX 开头
        if (/^DOMAIN-SUFFIX/i.test(line)) {
            line = line.replace(/DOMAIN-SUFFIX/i, "HOST-SUFFIX");
        } 
        
        // 匹配 DOMAIN-KEYWORD 开头
        if (/^DOMAIN-KEYWORD/i.test(line)) {
            line = line.replace(/DOMAIN-KEYWORD/i, "HOST-KEYWORD");
        } 
        
        // 匹配 DOMAIN 开头 (增加边界判断防止误伤 SUFFIX)
        if (/^DOMAIN,/i.test(line) || /^DOMAIN$/i.test(line)) {
            line = line.replace(/DOMAIN/i, "HOST");
        }

        // 返回处理后的 line
        return line;
    });

    $done({ content: processedLines.join("\n") });
}

main();

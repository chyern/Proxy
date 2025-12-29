// 检查资源内容是否存在
const content = $resource.content;

function main() {
    // 容错处理：如果内容为空，返回空字符串而不是报错
    if (!content || content.trim() === "") {
        $done({ content: "" });
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
        if (/^DOMAIN-SUFFIX/i.test(line)) {
            line = line.replace(/DOMAIN-SUFFIX/i, "HOST-SUFFIX");
        } 
        
        if (/^DOMAIN-KEYWORD/i.test(line)) {
            line = line.replace(/DOMAIN-KEYWORD/i, "HOST-KEYWORD");
        } 
        
        if (/^DOMAIN,/i.test(line) || /^DOMAIN$/i.test(line)) {
            line = line.replace(/DOMAIN/i, "HOST");
        }

        return line;
    });

    // 关键点：确保使用 $done 返回一个包含 content 属性的对象
    // 并且使用 .filter(Boolean) 确保没有 undefined 行
    let finalContent = processedLines.filter(l => typeof l === 'string').join("\n");
    $done({ content: finalContent });
}

main();

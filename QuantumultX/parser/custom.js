/**
 * Quantumult X 资源解析器 - 终极修复版
 */

async function main() {
    // 1. 优先获取 $resource.content，如果没有则通过 $resource.url 发起请求
    let rawContent = typeof $resource !== "undefined" ? $resource.content : null;
    let url = typeof $resource !== "undefined" ? $resource.url : null;

    if (!rawContent && url) {
        // 如果 content 为空，尝试手动拉取
        const response = await $.get(url);
        rawContent = response.body;
    }

    if (!rawContent) {
        $done({ error: "无法获取资源内容" });
        return;
    }

    // 2. 逻辑处理
    let lines = rawContent.split(/\r?\n/);
    
    let processedLines = lines.map(item => {
        let line = item.trim();

        // 过滤空行和注释
        if (line === "" || line.startsWith("#") || line.startsWith(";")) {
            return line; 
        }

        // 独立 if 判断开头
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

    // 3. 最终返回：必须是一个包含 content 属性的对象
    $done({ content: processedLines.join("\n") });
}

// 简单的辅助函数，确保支持异步请求
const $ = {
    get: (url) => {
        return new Promise((resolve, reject) => {
            $task.fetch({ url }).then(response => resolve(response), reason => reject(reason));
        });
    }
};

main();

const rawContent = $resource.content;

// 1. 执行转换
rawContent = shadowrocketToQuantumultX(rawContent);
$done({ content: rawContent });

function shadowrocketToQuantumultX(content) {
    return content;
}

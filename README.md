# Proxy rules

Shadowrocket 与 Quantumult X 的个人分流和广告过滤规则。

## Shadowrocket

主配置地址：

```text
https://raw.githubusercontent.com/chyern/Proxy/main/Shadowrocket/custom.conf
```

在 Shadowrocket 的“配置”页面通过 URL 下载并启用该配置。主配置会自动加载以下自有规则集：

| 规则集 | 策略 | 用途 |
| --- | --- | --- |
| `Shadowrocket/rule/ad_black.list` | `REJECT-DROP` | 广告、跟踪与 HTTPDNS 拦截 |
| `Shadowrocket/rule/proxy.list` | `PROXY` | 强制代理 |
| `Shadowrocket/rule/direct.list` | `DIRECT` | 强制直连 |

三个 `.list` 文件也可作为远程规则集单独使用，调用方需要为其指定相应策略。主配置不依赖手机上预先存在的本地配置文件。

第三方 AWAvenue 广告规则固定到已审核的提交 `e0ee1783c906d557adccab6aecca1c55d3b93417`，避免上游 `main` 分支变化直接影响客户端。升级时应先检查差异，再更新 `Shadowrocket/custom.conf` 中的提交 SHA。

## Quantumult X

过滤规则地址：

```text
https://raw.githubusercontent.com/chyern/Proxy/main/QuantumultX/filter/ad_black.conf
```

该文件由 Shadowrocket 广告列表生成。无法等价放入 Quantumult X 过滤资源的 `URL-REGEX` 不会写入生成结果。

## 维护与校验

重新生成 Quantumult X 规则：

```bash
python3 scripts/generate_quantumultx.py
```

检查生成文件是否最新并校验全部配置：

```bash
python3 scripts/generate_quantumultx.py --check
python3 scripts/validate_rules.py
```

CI 会在每次 push 和 pull request 时执行相同检查。修改规则后应先运行生成器，再提交生成文件。

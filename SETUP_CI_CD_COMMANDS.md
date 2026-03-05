# CI/CD 配置命令 - 手动执行指南

## 🔑 步骤1: 使用Token登录GitHub CLI

在PowerShell中执行以下命令（**一行一行执行**）：

```powershell
# 方法1: 使用环境变量（推荐）
# ⚠️ 注意：PowerShell中必须使用 $env: 前缀，不是 env:
$env:GITHUB_TOKEN = "<YOUR_GITHUB_PAT>"

# 验证登录状态
gh auth status

# 测试连接（如果仓库存在）
# gh repo view
# 如果上面的命令失败，可以跳过，直接配置secrets
```

**如果环境变量方式不行，使用方法2**：直接写入配置文件

```powershell
# 找到配置文件位置
$ghConfigPath = "$env:USERPROFILE\.config\gh\hosts.yml"
# 或者手动编辑配置文件，添加token
```

## 📝 步骤2: 配置GitHub Secrets

**注意**：
- 如果SSH密钥文件不存在，可以先跳过SSH_PRIVATE_KEY，稍后配置
- 如果 `gh repo view` 失败，可能是仓库名称不对或权限问题，但可以直接配置secrets

```powershell
# 2.1 确认当前仓库（可选，如果失败可以跳过）
git remote -v

# 2.2 配置服务器信息（这些是必需的）
# 注意：如果不在Git仓库目录，需要指定 --repo 参数
gh secret set SERVER_HOST --body "43.143.139.197"
gh secret set SERVER_USER --body "ubuntu"
gh secret set SERVER_URL --body "http://43.143.139.197:8080"

# 如果上面的命令失败，尝试指定仓库名称（替换为你的实际仓库名）
# gh secret set SERVER_HOST --body "43.143.139.197" --repo 你的用户名/仓库名
# gh secret set SERVER_USER --body "ubuntu" --repo 你的用户名/仓库名
# gh secret set SERVER_URL --body "http://43.143.139.197:8080" --repo 你的用户名/仓库名

# 2.3 配置SSH私钥（如果密钥文件存在）
if (Test-Path "enterprise_ai_platform.pem") {
    Get-Content enterprise_ai_platform.pem -Raw | gh secret set SSH_PRIVATE_KEY
    # 如果失败，尝试指定仓库
    # Get-Content enterprise_ai_platform.pem -Raw | gh secret set SSH_PRIVATE_KEY --repo 你的用户名/仓库名
} else {
    Write-Host "⚠️  密钥文件不存在，请稍后手动配置 SSH_PRIVATE_KEY" -ForegroundColor Yellow
}

# 2.4 验证配置
gh secret list
```

## 🚀 步骤3: 启动CI/CD工作流

```powershell
# 3.1 查看所有可用的工作流
gh workflow list

# 3.2 触发部署工作流（选择环境）
# staging环境
gh workflow run "Deploy to Server.yml" --field environment=staging

# 或者 production环境
gh workflow run "Deploy to Server.yml" --field environment=production

# 或者 development环境
gh workflow run "Deploy to Server.yml" --field environment=development

# 3.3 查看工作流运行状态
gh run list --workflow="Deploy to Server.yml" --limit 5

# 3.4 实时查看最新运行的日志
gh run watch

# 3.5 查看特定运行的详细信息
# 先获取run-id
gh run list --workflow="Deploy to Server.yml" --limit 1
# 然后查看日志（替换<run-id>为实际的ID）
gh run view <run-id> --log
```

## 🔍 故障排除命令

```powershell
# 检查GitHub CLI版本
gh --version

# 检查登录状态
gh auth status

# 检查仓库权限
gh repo view

# 列出所有secrets（验证配置）
gh secret list

# 查看工作流文件
gh workflow view "Deploy to Server.yml"

# 查看失败的工作流
gh run list --status=failure --limit 10
```

## ⚡ 快速一键执行脚本

如果你想一次性执行所有配置，可以创建一个临时脚本：

```powershell
# 复制以下内容到PowerShell执行
# ⚠️ 注意：PowerShell中必须使用 $env: 前缀（带$符号）

# 1. 设置token（注意：$env: 前面必须有 $ 符号）
$env:GITHUB_TOKEN = "<YOUR_GITHUB_PAT>"

# 2. 验证登录
Write-Host "验证GitHub CLI登录..." -ForegroundColor Cyan
gh auth status

# 3. 配置Secrets
Write-Host "`n配置GitHub Secrets..." -ForegroundColor Cyan
gh secret set SERVER_HOST --body "43.143.139.197"
gh secret set SERVER_USER --body "ubuntu"
gh secret set SERVER_URL --body "http://43.143.139.197:8080"

# 4. 配置SSH密钥（如果存在）
if (Test-Path "enterprise_ai_platform.pem") {
    Write-Host "配置SSH密钥..." -ForegroundColor Cyan
    Get-Content enterprise_ai_platform.pem -Raw | gh secret set SSH_PRIVATE_KEY
} else {
    Write-Host "⚠️  SSH密钥文件不存在，请稍后手动配置" -ForegroundColor Yellow
}

# 5. 验证配置
Write-Host "`n验证Secrets配置..." -ForegroundColor Cyan
gh secret list

# 6. 启动工作流
Write-Host "`n启动CI/CD工作流..." -ForegroundColor Cyan
gh workflow run "Deploy to Server.yml" --field environment=staging

# 7. 查看状态
Write-Host "`n查看工作流状态..." -ForegroundColor Cyan
gh run list --workflow="Deploy to Server.yml" --limit 3
```

## 📌 重要提示

1. **Token安全**：执行完命令后，建议清除环境变量：
   ```powershell
   Remove-Item Env:\GITHUB_TOKEN
   ```

2. **SSH密钥**：如果SSH密钥文件不存在，可以通过以下方式获取：
   - 检查 `$env:USERPROFILE\.ssh\` 目录
   - 或者联系服务器管理员获取密钥文件

3. **工作流名称**：确保工作流文件名正确，可以通过 `gh workflow list` 查看

4. **权限问题**：如果遇到权限错误，确保：
   - Token有足够的权限（repo, workflow等）
   - 你是仓库的拥有者或协作者

---

**创建时间**: 2025-12-03
**Token**: 已提供（请妥善保管）


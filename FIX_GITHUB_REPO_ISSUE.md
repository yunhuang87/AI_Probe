# 修复GitHub仓库访问问题

## 🔍 问题诊断

如果遇到 `Could not resolve to a Repository` 错误，可能的原因：

1. **仓库名称不正确**
2. **Token没有访问权限**
3. **仓库不存在或已被删除**
4. **仓库是私有的，需要确认权限**

## ✅ 解决方案

### 方案1: 确认正确的仓库名称

```powershell
# 1. 查看当前远程仓库配置
git remote -v

# 2. 列出你的所有仓库（确认正确的仓库名）
gh repo list

# 3. 如果仓库名不对，更新远程URL
# git remote set-url origin git@github.com:正确的用户名/正确的仓库名.git
```

### 方案2: 直接配置Secrets（推荐）

即使 `gh repo view` 失败，也可以直接配置secrets。GitHub CLI会自动使用当前目录的Git仓库信息：

```powershell
# 确保在项目根目录
cd E:\enterprise-ai-platform

# 直接配置secrets（GitHub CLI会自动检测仓库）
gh secret set SERVER_HOST --body "43.143.139.197"
gh secret set SERVER_USER --body "ubuntu"
gh secret set SERVER_URL --body "http://43.143.139.197:8080"

# 如果SSH密钥存在
if (Test-Path "enterprise_ai_platform.pem") {
    Get-Content enterprise_ai_platform.pem -Raw | gh secret set SSH_PRIVATE_KEY
}
```

### 方案3: 手动指定仓库名称

如果自动检测失败，可以手动指定仓库：

```powershell
# 替换为你的实际仓库名称
$repo = "你的用户名/仓库名"

gh secret set SERVER_HOST --body "43.143.139.197" --repo $repo
gh secret set SERVER_USER --body "ubuntu" --repo $repo
gh secret set SERVER_URL --body "http://43.143.139.197:8080" --repo $repo
```

### 方案4: 通过GitHub Web界面配置

如果CLI方式都不行，可以通过Web界面：

1. 访问：`https://github.com/你的用户名/仓库名/settings/secrets/actions`
2. 点击 `New repository secret`
3. 添加以下secrets：
   - `SERVER_HOST`: `43.143.139.197`
   - `SERVER_USER`: `ubuntu`
   - `SERVER_URL`: `http://43.143.139.197:8080`
   - `SSH_PRIVATE_KEY`: 密钥文件内容

## 🔧 检查Token权限

```powershell
# 检查token权限
gh auth status

# 如果需要重新登录
$env:GITHUB_TOKEN = "你的token"
gh auth refresh -h github.com -s repo,workflow
```

## 📋 快速修复命令

```powershell
# 1. 确认在正确的目录
cd E:\enterprise-ai-platform

# 2. 设置token
$env:GITHUB_TOKEN = "<YOUR_GITHUB_PAT>"

# 3. 尝试列出你的仓库（确认仓库名）
gh repo list --limit 10

# 4. 如果能看到仓库，直接配置secrets
gh secret set SERVER_HOST --body "43.143.139.197"
gh secret set SERVER_USER --body "ubuntu"
gh secret set SERVER_URL --body "http://43.143.139.197:8080"

# 5. 验证
gh secret list
```

---

**提示**：如果所有方法都失败，建议通过GitHub Web界面手动配置secrets。






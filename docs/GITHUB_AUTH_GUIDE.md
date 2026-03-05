# GitHub 认证方式准备与确认指南

## 一、两种常用认证方式对比

| 方式 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| **HTTPS + Personal Access Token** | 临时使用、多设备、不常配 SSH | 配置简单，浏览器登录即可生成 Token | 需保管 Token，过期需重新生成 |
| **SSH 密钥** | 长期开发、本机固定使用 | 一次配置长期有效，无需每次输密码 | 需生成密钥并添加到 GitHub |

---

## 二、方式一：HTTPS + Personal Access Token（推荐新手）

### 2.1 准备 Token

1. 登录 [GitHub](https://github.com)，右上角头像 → **Settings**。
2. 左侧最下方 **Developer settings** → **Personal access tokens** → **Tokens (classic)**。
3. 点击 **Generate new token** → **Generate new token (classic)**。
4. 填写：
   - **Note**：随意，如 `PC-Cursor-2026`。
   - **Expiration**：选 90 days 或 No expiration（无过期）。
   - **Scopes**：至少勾选 **`repo`**（完整仓库权限）；若仓库在组织下，按组织要求可能还需勾选 `workflow` 等。
5. 点击 **Generate token**，**立即复制并保存** Token（只显示一次）。

推送时：
- 用户名：您的 GitHub 用户名  
- 密码：**粘贴 Token**（不是登录密码）

### 2.2 确认本机是否在用 HTTPS

在项目目录打开终端执行：

```powershell
# 查看当前远程地址（若已配置 remote）
git remote -v
```

- 若显示 `https://github.com/用户名/仓库名.git` → 当前为 **HTTPS**，推送时用 Token 即可。
- 若显示 `git@github.com:用户名/仓库名.git` → 当前为 **SSH**，若要改用 HTTPS 可执行：
  ```powershell
  git remote set-url origin https://github.com/用户名/仓库名.git
  ```

### 2.3 避免每次输入（可选）

Windows 可保存凭据，后续推送不再提示：

```powershell
# 启用 Git 凭据存储（当前用户）
git config --global credential.helper store
```

首次 `git push` 输入一次用户名和 Token 后，会保存到本地。

---

## 三、方式二：SSH 密钥

### 3.1 检查是否已有 SSH 密钥

在 PowerShell 或 CMD 中执行：

```powershell
# 查看是否已有公钥
dir $env:USERPROFILE\.ssh
```

若存在 `id_rsa.pub` 或 `id_ed25519.pub`，说明已有公钥，可跳过 3.2，直接做 3.3。

### 3.2 生成新的 SSH 密钥（若无）

```powershell
# 使用邮箱生成，推荐 ed25519
ssh-keygen -t ed25519 -C "您的GitHub邮箱@example.com" -f "$env:USERPROFILE\.ssh\id_ed25519"
```

提示时可直接回车（不设密码）或设置密码。生成后得到：
- 私钥：`%USERPROFILE%\.ssh\id_ed25519`（勿泄露、勿上传）
- 公钥：`%USERPROFILE%\.ssh\id_ed25519.pub`

### 3.3 把公钥添加到 GitHub

1. 复制公钥内容：
   ```powershell
   Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
   ```
   或打开 `id_ed25519.pub` 用记事本复制全部内容。
2. GitHub → 右上角头像 → **Settings** → 左侧 **SSH and GPG keys**。
3. **New SSH key**：Title 随意（如 `My PC`），Key 粘贴公钥 → **Add SSH key**。

### 3.4 确认 SSH 是否生效

```powershell
ssh -T git@github.com
```

成功时会看到类似：`Hi 用户名! You've successfully authenticated...`

### 3.5 使用 SSH 地址作为远程

添加或修改远程仓库时使用 SSH 地址：

```powershell
git remote add origin git@github.com:用户名/仓库名.git
# 若已存在 origin 且是 HTTPS，可改为：
# git remote set-url origin git@github.com:用户名/仓库名.git
```

之后 `git push` / `git pull` 将走 SSH，不再输入用户名和密码。

---

## 四、如何确定当前 / 将要使用的认证方式

| 操作 | 结论 |
|------|------|
| 执行 `git remote -v`，显示 `https://github.com/...` | 使用 **HTTPS**，需准备 **Personal Access Token**，推送时密码处填 Token。 |
| 执行 `git remote -v`，显示 `git@github.com:...` | 使用 **SSH**，需本机有 SSH 密钥且公钥已添加到 GitHub。 |
| 执行 `ssh -T git@github.com` 显示 `successfully authenticated` | **SSH 已就绪**，可直接用 SSH 地址 push。 |
| 尚未配置远程 | 先选一种方式：选 HTTPS 则用 `https://github.com/.../....git` + Token；选 SSH 则按第三节配置后再用 `git@github.com:.../....git`。 |

---

## 五、常见问题

**Q：推送时提示 `Support for password authentication was removed`**  
A：GitHub 已不再支持账号密码，必须用 **Personal Access Token**（HTTPS）或 **SSH 密钥**。

**Q：Token 填在哪里？**  
A：`git push` 时提示输入密码，把 Token 粘贴到“密码”框即可（用户名填 GitHub 用户名）。

**Q：如何切换成 SSH？**  
A：先按第三节完成 SSH 配置并测试 `ssh -T git@github.com`，再执行：
`git remote set-url origin git@github.com:用户名/仓库名.git`

**Q：公司网络禁止 SSH 22 端口怎么办？**  
A：可使用 HTTPS + Token；或配置 SSH 走 443 端口（GitHub 支持），在 `%USERPROFILE%\.ssh\config` 中为 github.com 设置 `Port 443` 和 `Hostname ssh.github.com`。

---

按上述步骤准备并测试后，即可在创建分支 `AI_Template_LYB_20260305` 并推送时使用对应认证方式。

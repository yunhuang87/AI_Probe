# 创建分支并推送核心代码到 GitHub - 所需信息与步骤

## 一、需要您提供的信息

### 1. GitHub 仓库地址（必填）

请提供您已创建好的仓库的 **克隆地址**，二选一即可：

- **HTTPS**（示例）：`https://github.com/您的用户名/仓库名.git`  
  - 推送时需输入 GitHub 用户名 + **Personal Access Token**（不再支持账号密码）。
- **SSH**（示例）：`git@github.com:您的用户名/仓库名.git`  
  - 需本机已配置 SSH 公钥并添加到 GitHub。

**请直接给出您的仓库地址**，例如：  
`https://github.com/YourOrg/AI-Platform.git`

---

### 2. 认证方式确认（便于排查问题）

- 若使用 **HTTPS**：请确认本机已安装 Git，且您有该仓库的 **Personal Access Token**（Settings → Developer settings → Personal access tokens）。推送时用户名填 GitHub 用户名，密码处填 Token。
- 若使用 **SSH**：请确认已执行过 `ssh -T git@github.com` 并显示成功。

无需在文档或对话中写出 Token 或密码，只需确认“已准备好”即可。

---

### 3. 可选：需要排除的额外内容

当前仓库根目录下的 **`.gitignore`** 已包含常见“非核心、部署/临时”内容，例如：

- 敏感/环境：`.env`、`.env.local`、`*.key`、`*.pem`
- Python：`__pycache__/`、`venv/`、`.venv/`、`*.pyc`
- Node：`node_modules/`、`web-ui/.next/`、`web-ui/out/`
- 构建/临时：`dist/`、`build/`、`temp/`、`tmp/`、`logs/`、`*.log`
- 其他：`.idea/`、`.vscode/`、`*.zip` 等

若您还有**指定目录或文件**不希望进入该分支（例如某部署脚本、本地配置目录），请列出路径，便于补充到 `.gitignore` 或说明在提交时排除。

---

## 二、将执行的操作（您提供仓库地址后）

在**当前项目根目录**（即本仓库所在目录）下，将依次执行：

1. **初始化 Git**（若当前目录尚未是 Git 仓库）：  
   `git init`
2. **添加远程仓库**：  
   `git remote add origin <您提供的仓库地址>`
3. **创建并切换到新分支**：  
   `git checkout -b AI_Template_LYB_20260305`
4. **添加所有文件**（由 `.gitignore` 自动排除临时/环境文件）：  
   `git add .`
5. **首次提交**：  
   `git commit -m "Initial commit: AI Template LYB 20260305"`
6. **推送到远程分支**（若远程尚无该分支会自动创建）：  
   `git push -u origin AI_Template_LYB_20260305`

**说明**：当前目录目前**不是** Git 仓库（未发现 `.git`），因此会从 `git init` 开始。若您希望保留与现有 GitHub 仓库的提交历史，请说明仓库是否已有内容及默认分支名（如 `main`/`master`），以便改为“克隆后复制代码再提交”的方式。

---

## 三、请回复的内容（便于继续操作）

请按下面格式回复（可复制后填空）：

```
1. 仓库地址：https://github.com/___/___.git （或 SSH 地址）
2. 认证方式：HTTPS（已备 Token）/ SSH（已配置）
3. 当前 GitHub 仓库是否为空？是 / 否（若否，默认分支名是？）
4. 是否有需要额外排除的目录或文件？无 / 有（请列出）
```

提供上述信息后，即可按“二”中步骤为您生成或执行相应命令，完成分支 `AI_Template_LYB_20260305` 的创建与核心代码的上传。

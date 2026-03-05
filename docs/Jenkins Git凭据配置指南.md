# Jenkins Git凭据配置指南

## 问题描述

Jenkins无法连接GitHub仓库，错误信息：
```
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed for 'https://github.com/PMLiuyubin/enterprise-ai-platform.git/'
```

## 原因

GitHub从2021年8月13日起，不再支持密码认证，必须使用以下方式之一：
1. **Personal Access Token (PAT)** - 推荐用于HTTPS
2. **SSH密钥** - 推荐用于SSH

## 解决方案

### 方案1: 使用Personal Access Token（推荐）

#### 步骤1: 创建GitHub Personal Access Token

1. 登录GitHub: https://github.com
2. 进入 **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. 点击 **Generate new token** → **Generate new token (classic)**
4. 配置Token：
   - **Note**: Jenkins CI/CD
   - **Expiration**: 选择过期时间（建议90天或更长）
   - **Scopes**: 勾选以下权限：
     - ✅ `repo` (完整仓库访问权限)
     - ✅ `workflow` (如果需要访问GitHub Actions)
5. 点击 **Generate token**
6. **重要**: 立即复制Token，只显示一次！

#### 步骤2: 在Jenkins中配置Git凭据

1. 进入Jenkins: `http://1.117.62.202:8080`
2. 进入: **Manage Jenkins** → **Manage Credentials**
3. 点击 **(global)** → **Add Credentials**
4. 配置凭据：
   - **Kind**: Username with password
   - **Scope**: Global
   - **Username**: 你的GitHub用户名（例如：`PMLiuyubin`）
   - **Password**: 粘贴刚才创建的Personal Access Token
   - **ID**: `github-credentials`（或自定义）
   - **Description**: GitHub Personal Access Token
5. 点击 **OK** 保存

#### 步骤3: 更新Pipeline配置

在Pipeline任务配置中：

1. **Pipeline** 标签：
   - **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/PMLiuyubin/enterprise-ai-platform.git`
   - **Credentials**: 选择刚才创建的凭据（`github-credentials`）
   - **Branches to build**: `*/main`
   - **Script Path**: `Jenkinsfile`

2. 点击 **Save**

### 方案2: 使用SSH密钥

#### 步骤1: 生成SSH密钥对（如果还没有）

在Jenkins服务器上执行：

```bash
ssh -i Jenkins.pem ubuntu@1.117.62.202
sudo -u jenkins ssh-keygen -t ed25519 -C "jenkins@1.117.62.202" -f /var/lib/jenkins/.ssh/id_ed25519 -N ""
```

#### 步骤2: 将公钥添加到GitHub

1. 查看公钥：
```bash
sudo cat /var/lib/jenkins/.ssh/id_ed25519.pub
```

2. 在GitHub中添加SSH密钥：
   - 进入 **Settings** → **SSH and GPG keys**
   - 点击 **New SSH key**
   - **Title**: Jenkins Server
   - **Key**: 粘贴公钥内容
   - 点击 **Add SSH key**

#### 步骤3: 在Jenkins中配置SSH凭据

1. 进入: **Manage Jenkins** → **Manage Credentials**
2. 点击 **(global)** → **Add Credentials**
3. 配置：
   - **Kind**: SSH Username with private key
   - **ID**: `github-ssh-key`
   - **Username**: `git`
   - **Private Key**: 选择 **Enter directly**
   - 粘贴私钥内容（`/var/lib/jenkins/.ssh/id_ed25519`）
   - **Description**: GitHub SSH Key
4. 点击 **OK**

#### 步骤4: 更新Pipeline配置

在Pipeline任务配置中：

1. **Repository URL**: 改为SSH格式
   - `git@github.com:PMLiuyubin/enterprise-ai-platform.git`
2. **Credentials**: 选择 `github-ssh-key`
3. 其他配置保持不变

### 方案3: 使用GitHub App（高级，可选）

如果需要更细粒度的权限控制，可以使用GitHub App，但配置较复杂，一般不需要。

## 测试连接

配置完成后，可以测试连接：

### 在Jenkins服务器上测试

**使用HTTPS + Token:**
```bash
sudo -u jenkins git ls-remote https://github.com/PMLiuyubin/enterprise-ai-platform.git HEAD
```

**使用SSH:**
```bash
sudo -u jenkins git ls-remote git@github.com:PMLiuyubin/enterprise-ai-platform.git HEAD
```

如果成功，会显示commit hash。

## 更新Jenkinsfile（如果需要）

如果仓库是私有的，确保Pipeline配置中使用了正确的凭据：

```groovy
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo '📥 检出代码...'
                git branch: 'main',
                    url: 'https://github.com/PMLiuyubin/enterprise-ai-platform.git',
                    credentialsId: 'github-credentials'  // 使用配置的凭据ID
            }
        }
        // ... 其他阶段
    }
}
```

## 常见问题

### Q1: Token已过期

**解决方案**: 重新生成Token并更新Jenkins凭据

### Q2: 权限不足

**解决方案**: 确保Token有 `repo` 权限

### Q3: SSH连接失败

**解决方案**:
1. 检查SSH密钥是否正确添加到GitHub
2. 测试SSH连接: `ssh -T git@github.com`
3. 检查known_hosts: 首次连接需要确认GitHub的host key

### Q4: 仍然提示认证失败

**解决方案**:
1. 检查凭据ID是否正确
2. 确认Pipeline配置中使用了正确的凭据
3. 清除Jenkins的Git缓存：
   ```bash
   sudo rm -rf /var/lib/jenkins/.git*
   ```

## 推荐方案

**推荐使用方案1（Personal Access Token）**，因为：
- ✅ 配置简单
- ✅ 易于管理
- ✅ 可以设置过期时间
- ✅ 可以随时撤销

## 安全建议

1. **Token安全**:
   - 不要将Token提交到代码仓库
   - 定期轮换Token
   - 使用最小权限原则

2. **SSH密钥安全**:
   - 使用强密码保护私钥
   - 定期轮换密钥
   - 限制密钥权限

3. **凭据管理**:
   - 使用Jenkins凭据管理，不要硬编码
   - 定期审查凭据使用情况



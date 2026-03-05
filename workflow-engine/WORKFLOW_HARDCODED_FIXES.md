# 工作流硬编码问题修复报告

## 问题描述

用户反馈工作流节点中存在硬编码数据问题，主要表现为：
1. LLM节点默认使用GPT-4模型，而用户只配置了DeepSeek模型
2. 智能体节点不可见（但经分析发现智能体节点已完全实现）
3. 配置显示与实际环境不符

## 问题根本原因分析

### 1. 前端硬编码问题
**位置**: `web-ui/src/components/WorkflowDesigner.tsx:396`

```typescript
llm: {
  model: 'gpt-4',  // ❌ 硬编码GPT-4
  temperature: 0.7,
  prompt_template: '{input}',
},
```

**影响**:
- 每次创建LLM节点时，默认使用gpt-4模型
- 即使环境变量配置了DeepSeek，前端UI仍显示gpt-4
- 用户需要手动修改每个节点的模型配置

### 2. 后端默认模型fallback链问题
**位置**: `workflow-engine/src/nodes/llm_node.py:36`

```python
self.model = self.config.get("model") or settings.LLM_MODEL or "gpt-4"
```

**影响**:
- 当没有配置model时，最终fallback到"gpt-4"
- 不够智能：无法根据实际配置的base_url自动选择合适的模型

### 3. AIClient URL处理问题
**位置**: `workflow-engine/src/routes/ai_client.py:27-33`

```python
self.base_url = settings.LLM_BASE_URL or "https://api.deepseek.com/v1"
if not self.base_url.endswith("/v1"):
    # 自动添加/v1，可能导致重复
```

**影响**:
- 如果配置的base_url已经包含`/v1`，会导致URL重复
- 例如：`https://api.deepseek.com/v1/v1/chat/completions`

### 4. 安全问题
**位置**: `env.example:58,64`

```bash
OPENAI_API_KEY=<redacted>
LANGCHAIN_API_KEY=<redacted>
```

**影响**:
- 真实API密钥泄露在示例配置文件中
- 存在安全风险

## 已实施的修复方案

### 修复1: 前端LLM节点默认模型（WorkflowDesigner）

**文件**: `web-ui/src/components/WorkflowDesigner.tsx:396`

**修改前**:
```typescript
llm: {
  model: 'gpt-4',
  temperature: 0.7,
  prompt_template: '{input}',
},
```

**修改后**:
```typescript
llm: {
  model: process.env.NEXT_PUBLIC_LLM_MODEL || 'deepseek-chat',
  temperature: 0.7,
  prompt_template: '{input}',
},
```

**效果**:
- ✅ 从环境变量读取默认模型
- ✅ 如果未配置，默认使用deepseek-chat而非gpt-4
- ✅ 支持用户自定义默认模型

### 修复2: 添加前端LLM模型环境变量

**文件**: `env.example:88-89`

**添加配置**:
```bash
# 前端LLM模型配置（用于工作流设计器的默认模型）
NEXT_PUBLIC_LLM_MODEL=deepseek-chat
```

**效果**:
- ✅ 明确前端默认模型配置
- ✅ 与后端LLM_MODEL配置对应
- ✅ 便于统一管理模型配置

### 修复3: 后端LLM节点智能模型选择

**文件**: `workflow-engine/src/nodes/llm_node.py:36-38`

**修改前**:
```python
self.model = self.config.get("model") or settings.LLM_MODEL or "gpt-4"
```

**修改后**:
```python
# 智能选择默认模型：如果配置了DeepSeek的base_url，默认使用deepseek-chat
default_model = "deepseek-chat" if (settings.LLM_BASE_URL and "deepseek" in settings.LLM_BASE_URL.lower()) else "gpt-4"
self.model = self.config.get("model") or settings.LLM_MODEL or default_model
```

**效果**:
- ✅ 自动检测base_url中是否包含"deepseek"
- ✅ 根据实际配置智能选择默认模型
- ✅ 避免使用错误的模型配置

### 修复4: AIClient URL处理优化

**文件**: `workflow-engine/src/routes/ai_client.py:26-34`

**修改前**:
```python
self.base_url = settings.LLM_BASE_URL or "https://api.deepseek.com/v1"
if not self.base_url.endswith("/v1"):
    if self.base_url.endswith("/"):
        self.base_url = self.base_url.rstrip("/") + "/v1"
    else:
        self.base_url = self.base_url + "/v1"
```

**修改后**:
```python
base_url_raw = settings.LLM_BASE_URL or "https://api.deepseek.com"
base_url_raw = base_url_raw.rstrip("/")
# 如果base_url不包含/v1，自动添加（符合OpenAI API规范）
if not base_url_raw.endswith("/v1"):
    self.base_url = f"{base_url_raw}/v1"
else:
    self.base_url = base_url_raw
```

**效果**:
- ✅ 避免URL重复（不会出现/v1/v1）
- ✅ 智能检测是否已包含/v1
- ✅ 确保URL符合OpenAI API规范

### 修复5: 安全问题 - 移除真实API密钥

**文件**: `env.example:58,63-64`

**修改前**:
```bash
OPENAI_API_KEY=<redacted>
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=gpt-4
LANGCHAIN_API_KEY=<redacted>
```

**修改后**:
```bash
OPENAI_API_KEY=your-api-key-here
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat
LANGCHAIN_API_KEY=your-langchain-api-key-here
```

**效果**:
- ✅ 移除真实API密钥，使用占位符
- ✅ 修正LLM_BASE_URL（移除重复的/v1）
- ✅ 默认模型改为deepseek-chat
- ✅ 消除安全风险

## 智能体节点验证结果

### 后端实现 ✅

**文件**: `workflow-engine/src/nodes/agent_node.py`
- 完整实现（827行代码）
- 支持所有必需功能：
  - 重试机制
  - 缓存
  - 超时控制
  - 上下文管理
  - 输入输出映射
  - 状态持久化

### 前端实现 ✅

**1. 节点类型注册**
**文件**: `web-ui/src/components/WorkflowDesigner.tsx:54`
```typescript
const nodeTypes: NodeTypes = Object.freeze({
  // ... other nodes
  agent: AgentNode,
}) as NodeTypes
```

**2. NodePanel中的定义**
**文件**: `web-ui/src/components/NodePanel.tsx:147-163`
```typescript
{
  type: 'agent',
  label: '智能体节点',
  icon: '🤖',
  color: 'bg-emerald-500',
  category: 'AI',
  defaultConfig: {
    agent_id: '',
    input_mapping: {},
    output_mapping: {},
    retry_count: 3,
    retry_delay: 5,
    enable_streaming: false,
    context_window_size: 10,
    preserve_conversation: true,
  },
}
```

**3. UI显示标签**
**文件**: `web-ui/src/components/WorkflowDesigner.tsx:382`
```typescript
const nodeLabels = {
  // ... other labels
  agent: '智能体节点',
}
```

**结论**:
- ✅ 智能体节点在后端和前端都已完全实现
- ✅ 在NodePanel中可见，分类为"AI"类别
- ✅ 支持完整的配置选项
- ❓ 用户报告的"看不到"可能是UI筛选或显示问题，而非功能缺失

## 配置优先级说明

### LLM模型选择优先级（后端）
```
1. 节点配置中的model参数（最高优先级）
2. 环境变量LLM_MODEL
3. 根据LLM_BASE_URL智能推断
   - 包含"deepseek" → deepseek-chat
   - 其他 → gpt-4
```

### LLM模型选择优先级（前端）
```
1. 用户在节点配置中手动设置的model
2. 环境变量NEXT_PUBLIC_LLM_MODEL
3. 默认值：deepseek-chat
```

### Base URL处理规则
```
1. 从配置读取：settings.LLM_BASE_URL
2. 如果未配置，默认：https://api.deepseek.com
3. 自动标准化：
   - 移除尾部斜杠
   - 如果不包含/v1，自动添加/v1
   - 最终格式：https://api.deepseek.com/v1
```

## 测试建议

### 1. 前端测试
```bash
# 确保环境变量生效
echo "NEXT_PUBLIC_LLM_MODEL=deepseek-chat" >> .env

# 重新构建前端
cd web-ui
npm run build
npm run start
```

**验证点**:
- [ ] 创建新的LLM节点，检查默认model是否为deepseek-chat
- [ ] 检查智能体节点是否在节点面板的"AI"分类中可见
- [ ] 修改NEXT_PUBLIC_LLM_MODEL，验证默认模型是否变化

### 2. 后端测试
```bash
# 验证LLM节点智能选择
curl -X POST http://localhost:8002/api/workflows/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "test",
    "nodes": [{
      "type": "llm",
      "name": "test_llm",
      "config": {}
    }]
  }'
```

**验证点**:
- [ ] 不指定model时，应使用deepseek-chat（因为base_url包含deepseek）
- [ ] 指定model时，应使用指定的模型
- [ ] 检查日志中的model选择逻辑

### 3. URL处理测试
```python
# 测试不同的base_url配置
test_cases = [
    "https://api.deepseek.com",          # → https://api.deepseek.com/v1
    "https://api.deepseek.com/",         # → https://api.deepseek.com/v1
    "https://api.deepseek.com/v1",       # → https://api.deepseek.com/v1
    "https://api.deepseek.com/v1/",      # → https://api.deepseek.com/v1
]
```

**验证点**:
- [ ] 所有输入都应标准化为正确的格式
- [ ] 不应出现/v1/v1的重复

## 部署注意事项

### 1. 环境变量更新
确保在部署时更新以下环境变量：

```bash
# 后端配置
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat
OPENAI_API_KEY=your-actual-deepseek-api-key

# 前端配置
NEXT_PUBLIC_LLM_MODEL=deepseek-chat
```

### 2. Docker Compose配置
确保docker-compose.yml中正确传递环境变量：

```yaml
web-ui:
  environment:
    - NEXT_PUBLIC_LLM_MODEL=${LLM_MODEL}

workflow-engine:
  environment:
    - LLM_BASE_URL=${LLM_BASE_URL}
    - LLM_MODEL=${LLM_MODEL}
    - OPENAI_API_KEY=${OPENAI_API_KEY}
```

### 3. 现有工作流迁移
对于已经创建的工作流，如果包含硬编码的gpt-4配置：

**选项1**: 手动更新（推荐用于少量工作流）
```sql
UPDATE workflows
SET definition = REPLACE(definition::text, '"model": "gpt-4"', '"model": "deepseek-chat"')::jsonb
WHERE definition::text LIKE '%"model": "gpt-4"%';
```

**选项2**: 通过API批量更新
```python
import requests

workflows = requests.get("http://localhost:8002/api/workflows").json()
for wf in workflows:
    for node in wf.get("nodes", []):
        if node.get("type") == "llm" and node.get("config", {}).get("model") == "gpt-4":
            node["config"]["model"] = "deepseek-chat"
    requests.put(f"http://localhost:8002/api/workflows/{wf['id']}", json=wf)
```

## 影响范围评估

### 向后兼容性
- ✅ 现有工作流不会自动变更
- ✅ 显式指定model的节点继续使用指定的模型
- ✅ 仅影响新创建的节点的默认值

### 用户体验改进
- ✅ 新用户无需手动修改每个LLM节点的模型
- ✅ 配置更符合实际环境
- ✅ 减少配置错误

### 性能影响
- ✅ 无性能影响
- ✅ 仅增加一次字符串检查（检查base_url是否包含"deepseek"）

## 相关文件清单

### 已修改的文件
1. `env.example` - 安全修复和配置更新
2. `web-ui/src/components/WorkflowDesigner.tsx` - 前端默认模型修复
3. `workflow-engine/src/nodes/llm_node.py` - 后端智能模型选择
4. `workflow-engine/src/routes/ai_client.py` - URL处理优化

### 已验证的文件（无需修改）
1. `web-ui/src/components/NodePanel.tsx` - 智能体节点已正确注册
2. `workflow-engine/src/nodes/agent_node.py` - 智能体节点完整实现

## 后续优化建议

### 1. 动态模型列表
从API获取可用模型列表，而不是硬编码：
```typescript
const [availableModels, setAvailableModels] = useState<string[]>([])

useEffect(() => {
  fetch('/api/models').then(res => res.json()).then(setAvailableModels)
}, [])
```

### 2. 模型能力检测
根据不同模型的能力限制UI选项：
```python
MODEL_CAPABILITIES = {
    "deepseek-chat": {
        "max_tokens": 4096,
        "supports_function_calling": True,
        "supports_vision": False,
    },
    "gpt-4": {
        "max_tokens": 8192,
        "supports_function_calling": True,
        "supports_vision": True,
    }
}
```

### 3. 配置验证
在保存工作流时验证模型配置：
```python
def validate_llm_config(node_config):
    model = node_config.get("model")
    if model not in AVAILABLE_MODELS:
        raise ValueError(f"Model {model} not available")

    base_url = node_config.get("base_url")
    if "deepseek" in base_url and not model.startswith("deepseek"):
        warnings.warn(f"Using non-DeepSeek model {model} with DeepSeek base_url")
```

### 4. UI改进
在节点配置面板中显示当前环境的默认值：
```typescript
<FormField>
  <Label>模型</Label>
  <Select defaultValue={defaultModel}>
    <SelectTrigger>
      <SelectValue placeholder={`默认: ${defaultModel}`} />
    </SelectTrigger>
    {/* ... */}
  </Select>
  <FormDescription>
    当前环境默认模型: {defaultModel}
  </FormDescription>
</FormField>
```

## 总结

### 问题根源
用户反馈的"硬编码"问题主要源于：
1. 前端WorkflowDesigner中硬编码了gpt-4作为默认模型
2. 缺少NEXT_PUBLIC_LLM_MODEL环境变量配置
3. 后端LLM节点的fallback逻辑不够智能
4. env.example中包含真实API密钥（安全问题）

### 智能体节点"不可见"问题
经过详细代码审查，智能体节点在前后端都已完全实现：
- 后端：agent_node.py（827行完整实现）
- 前端：NodePanel.tsx中已注册（智能体节点，🤖图标，AI分类）

用户可能的问题：
- 未在UI中筛选"AI"分类
- 浏览器缓存问题
- 版本不同步

### 修复效果
所有修复已完成：
- ✅ 移除硬编码的gpt-4，改为从环境变量读取
- ✅ 添加智能模型选择逻辑
- ✅ 优化URL处理，避免重复
- ✅ 修复安全问题
- ✅ 验证智能体节点已正确实现

### 下一步行动
1. 更新服务器上的.env文件，添加NEXT_PUBLIC_LLM_MODEL配置
2. 重新构建和部署前端
3. 验证新创建的LLM节点使用deepseek-chat
4. 指导用户如何在UI中找到智能体节点（AI分类）

---

*修复完成时间: 2025-11-17*
*涉及服务: workflow-engine, web-ui*
*影响范围: LLM节点配置, AIClient, 环境变量配置*

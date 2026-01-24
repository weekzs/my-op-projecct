# 1、基础命令

```bash
echo "# myOpencode" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/weekzs/myOpencode.git
git push -u origin main
# 清除单个文件（比如 README.md），这个是删除仓库里面的文件
git rm --cached README.md
# 清除中文文件夹（建议加引号，避免Git识别错误）
git rm --cached "OCR学习笔记"

```

```bash
#查看提交历史
git log
#撤销提交
git revert <commit_id>
# 查看远程 origin 仓库 main 分支的所有文件列表（按树形结构展示）
git ls-tree origin/main --name-only
把所有的change加到git index里然后再commit
git commit -a
git remote show
git status #查看当前状态
git restore 文件名  # Git 2.23+ 版本推荐
git remote rm origin 
git reset --hard id  #这个是之后的版本都不需要的回滚
git push -g #强制推送
git revert -n id  这个是新的版本
#删除文件是这个，不需要git
rm -rf skillport
```

# 2、ssh传输大文件

> 1. 这里默认不设置密码
> 2. 然后要是改了密钥
>    - git init要重新设置，不然有很多错误
> 3. 这里每一个要一一对应
>    - rsa
>    - ed25519

这是一个 SSH 密钥认证失败的问题。以下是中文解决方案：

## **问题原因：**
GitHub 无法识别你的 SSH 密钥，导致权限被拒绝。

## **解决方法：**

### **1. 检查 SSH 密钥是否存在：**
```bash
# 查看是否有 SSH 密钥
ls -al ~/.ssh
```
你应该能看到类似 `id_rsa`、`id_rsa.pub` 或 `id_ed25519`、`id_ed25519.pub` 的文件。

### **2. 如果没有 SSH 密钥，生成新的：**
```bash
# 生成新的 SSH 密钥（推荐使用 ed25519）
ssh-keygen -t ed25519 -C "你的邮箱@example.com"

# 或者使用 RSA（兼容性更好）
ssh-keygen -t rsa -b 4096 -C "你的邮箱@example.com"
```
按提示操作，可以设置密码（可选）。

### **3. 添加 SSH 密钥到 SSH 代理：**
```bash
# 启动 SSH 代理
eval "$(ssh-agent -s)"

# 添加 SSH 私钥到代理
ssh-add ~/.ssh/id_ed25519  # 如果使用 ed25519
# 或者
ssh-add ~/.ssh/id_rsa      # 如果使用 RSA
```

### **4. 复制公钥到 GitHub：**
```bash
# 显示公钥内容，然后复制
cat ~/.ssh/id_ed25519.pub
# 或者
cat ~/.ssh/id_rsa.pub
```

**在 GitHub 上添加公钥：**
1. 登录 GitHub
2. 点击右上角头像 → Settings
3. 左侧选择 **SSH and GPG keys**
4. 点击 **New SSH key**
5. 粘贴复制的公钥内容
6. 点击 **Add SSH key**

### **5. 测试 SSH 连接：**
```bash
# 测试是否配置成功
ssh -T git@github.com
```
如果看到类似这样的消息，说明成功：
```
Hi 你的用户名! You've successfully authenticated, but GitHub does not provide shell access.
```

### **6. 确认远程仓库使用 SSH URL：**
```bash
# 查看当前远程仓库地址
git remote -v

# 如果是 HTTPS URL，改为 SSH
git remote set-url origin git@github.com:用户名/仓库名.git
```

## **常见问题排查：**

### **如果还是失败：**
```bash
# 1. 检查 SSH 配置文件
cat ~/.ssh/config

# 如果没有配置文件，创建一个
# 在 ~/.ssh/config 中添加：
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519  # 或你的私钥路径
  AddKeysToAgent yes
```

### **Windows 特定问题：**
```bash
# 确保 Git Bash 以管理员身份运行
# 检查 Windows SSH 服务是否运行
Get-Service ssh-agent  # PowerShell

# 启动 SSH 代理服务
Start-Service ssh-agent
```

### **如果之前使用过 HTTPS：**
```bash
# 清除 Git 凭据缓存（Windows）
git config --global --unset credential.helper

# 或者手动删除凭据
# 控制面板 → 用户账户 → 凭据管理器 → Windows 凭据
# 删除 GitHub 相关的凭据
```

## **快速验证步骤：**
1. **生成密钥** → **添加到 SSH 代理** → **复制到 GitHub**
2. **测试连接** `ssh -T git@github.com`
3. **修改远程仓库 URL** 为 SSH 格式
4. **重新推送**

## **如果所有方法都失败：**
可以暂时切换回 HTTPS（不推荐长期使用）：
```bash
git remote set-url origin https://github.com/用户名/仓库名.git
# 然后使用个人访问令牌（PAT）代替密码
```

需要进一步帮助的话，请告诉我你执行 `ssh -T git@github.com` 时看到的具体错误信息。

# 3、删除历史提交

问题在于 **Git 历史记录中仍然包含这个大文件**！即使你现在删除了，Git 仍然记得这个文件曾经存在过。

## **根本原因：**
1. 你之前已经把这个大文件提交到了 Git 历史中
2. 虽然现在删除了，但 Git 仍然保留了历史记录
3. GitHub 在接收推送时会检查整个历史，发现有大文件就拒绝

## **解决方案：从历史中彻底删除大文件**

### **方法 1：使用 BFG Repo-Cleaner（推荐）**
```bash
# 1. 下载 BFG
# macOS: brew install bfg
# 或下载 JAR 文件：https://rtyley.github.io/bfg-repo-cleaner/

# 2. 备份当前仓库（重要！）
cp -r myOpencode myOpencode-backup

# 3. 删除所有历史中的 zip 文件
java -jar bfg.jar --strip-blobs-bigger-than 100M .

# 4. 清理并重新打包
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. 强制推送
git push -f origin main
```

### **方法 2：使用 git filter-branch**
```bash
# 1. 找到并删除所有历史中的 zip 文件
git filter-branch --tree-filter "find . -name '*.zip' -type f -delete" HEAD

# 或者更精确地删除特定文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch 'express-delivery-web (2).zip'" \
  --prune-empty --tag-name-filter cat -- --all

# 2. 清理
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 3. 强制推送
git push -f origin main
```

### **方法 3：最简单的方法 - 重新开始（如果代码不多）**
```bash
# 1. 备份当前代码（不包括 .git 文件夹）
mkdir ../myOpencode-backup
cp -r . ../myOpencode-backup

# 2. 删除本地仓库
cd ..
rm -rf myOpencode

# 3. 重新克隆（空的）仓库
git clone git@github.com:weekzs/myOpencode.git
cd myOpencode

# 4. 只复制必要的文件，不要复制 zip 文件
cp -r ../myOpencode-backup/readme.md .
cp -r ../myOpencode-backup/skills .
# 注意：不要复制 zip 文件！

# 5. 确保 .gitignore 正确
echo "*.zip" > .gitignore
echo "*.tar.gz" >> .gitignore
echo "*.rar" >> .gitignore

# 6. 提交并推送
git add .
git commit -m "重新开始，移除历史大文件"
git push origin main
```

### **方法 4：检查当前历史中的大文件**
```bash
# 查看哪些提交包含大文件
git log --all --stat | grep -B 5 -A 5 "zip"

# 查看文件大小历史
git rev-list --objects --all | \
  grep "$(git verify-pack -v .git/objects/pack/*.idx | \
  sort -k 3 -n | tail -10 | awk '{print$1}')"

# 查找大文件的提交
git log --oneline --branches -- express-delivery-web\ \(2\).zip
```

## **推荐的最简单解决方案：**
```bash
# 1. 创建一个新的干净分支
git checkout --orphan clean-branch
git add .
git commit -m "新的干净提交"

# 2. 删除原来的 main 分支
git branch -D main

# 3. 重命名当前分支为 main
git branch -m main

# 4. 强制推送到远程
git push -f origin main
```

## **预防措施：**
```bash
# 在提交前检查文件大小
git add --dry-run .

# 或者写个钩子检查
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
MAX_FILE_SIZE=104857600  # 100MB in bytes

# 检查所有将要提交的文件
files=$(git diff --cached --name-only)
for file in $files; do
    size=$(git cat-file -s :"$file" 2>/dev/null || wc -c < "$file")
    if [ "$size" -gt "$MAX_FILE_SIZE" ]; then
        echo "错误: $file 超过 100MB (大小: $((size/1048576))MB)"
        echo "请使用 Git LFS 或移除该文件"
        exit 1
    fi
done
EOF

chmod +x .git/hooks/pre-commit
```

## **立即行动方案：**
```bash
# 如果你觉得上面的方法太复杂，试试这个：
# 1. 创建新的干净仓库
cd ..
mkdir myOpencode-clean
cd myOpencode-clean
git init
git remote add origin git@github.com:weekzs/myOpencode.git

# 2. 只添加必要的文件
cp -r ../myOpencode/readme.md .
cp -r ../myOpencode/skills .
# 不复制 zip 文件！

# 3. 设置 .gitignore
echo "*.zip" > .gitignore

# 4. 强制推送
git add .
git commit -m "干净版本，无大文件"
git push -f origin main
```

**重要提醒**：这些方法都会重写 Git 历史，如果你和他人协作，需要通知他们重新克隆仓库。

# 4、git提交不同分支

> 1、查看所有分支：
>
> ```bash
> git branch -a
> ```
>
> 2、强制提交分支：
>
> ```bash
> git checkout -f main
> ```

**1. 克隆远程仓库到本地**

```bash
git clone <远程仓库地址>
```

若需要直接拉取特定分支：

```bash
git clone -b <分支名> <远程仓库地址>
```

**2. 创建并切换到个人分支**

如果需要新建分支：

```bash
git checkout -b <分支名>
```

切换到已有分支：

```bash
git checkout <分支名>
```

查看当前分支状态：

```bash
git branch
```

**3. 添加修改并提交到本地仓库**

- 查看修改状态：

```bash
git status
```

- 添加文件到暂存区：

```bash
git add <文件名> 或 git add
```

- 提交更改到本地仓库：

```bash
git commit -m "提交说明"
```

**4. 推送分支到远程仓库**

将本地分支推送到远程：

```bash
git push origin <分支名>
```

如果远程不存在该分支，Git 会自动创建。

**5. 更新主分支代码到个人分支（可选）**

- 切换到主分支并拉取最新代码：

```bash
git checkout master
git pull origin master
```

- 切换回个人分支并合并主分支代码：

```bash
git checkout <个人分支名>
#这个是将master修改的分支合并
git merge master
```

- 再次推送更新后的个人分支：

```bash
git push origin <个人分支名>
```

# 5、暂存相关



| 命令                                | 作用                             | 适用场景                       |
| :---------------------------------- | :------------------------------- | :----------------------------- |
| **`git reset HEAD <文件名>`**       | 将**指定文件**从暂存区移回工作区 | 精确取消暂存特定文件           |
| **`git reset HEAD`**                | 将**所有文件**移出暂存区         | 全部重来，重新选择要添加的文件 |
| **`git restore --staged <文件名>`** | 取消暂存指定文件（Git 2.23+）    | 较新的 Git 版本，更直观        |

```bash
# 只取消暂存 server.ts 文件
git reset HEAD express-delivery-web/backend/src/server.ts

# 取消所有暂存的文件
git reset HEAD

# 使用 restore 命令取消暂存
git restore --staged express-delivery-web/frontend/package.json
```

## 如何查看暂存区内容

查看暂存区最直接的方法就是使用 `git status`，但Git还提供了更详细的查看方式：

| 命令                    | 显示内容                             | 示例输出说明                     |
| :---------------------- | :----------------------------------- | :------------------------------- |
| **`git status`**        | 显示**所有**状态，包括“待提交的变更” | 绿色文件就是暂存区内容           |
| **`git status -s`**     | 简洁状态显示，首列就是暂存区状态     | `A`=已暂存新文件，`M`=已暂存修改 |
| **`git diff --staged`** | **详细对比**暂存区与上一次提交的差异 | 最完整的暂存区内容查看方式       |

**1. 使用 `git status` 查看：**

```bash
$ git status
On branch main
Changes to be committed:          # ← 这下面的就是暂存区内容
  (use "git restore --staged <file>..." to unstage)
        modified:   README.md     # ← 绿色显示，已暂存
        new file:   config.yaml   # ← 绿色显示，已暂存

Changes not staged for commit:    # ← 这下面的未暂存
  (use "git add <file>..." to update what will be committed)
        modified:   server.ts     # ← 红色显示，未暂存
```

**2. 使用简洁模式 `git status -s`：**

```bash
$ git status -s
M  README.md     # 第1列=M：已暂存的修改 (staged)
A  config.yaml   # 第1列=A：已暂存的新文件 (staged)
 M server.ts     # 第1列=空格：未暂存的修改 (unstaged)
```

- **首字母含义**：`M`=修改，`A`=新增，`D`=删除，`R`=重命名
- **第1列**：暂存区状态（绿色）
- **第2列**：工作区状态（红色）

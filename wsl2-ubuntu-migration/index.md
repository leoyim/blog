# WSL2 Ubuntu 迁移实战


## 前言

随着开发环境越来越复杂，WSL（Windows Subsystem for Linux）占用的空间也越来越大。

最初发现 WSL 占用了约 19GB 空间，而默认情况下 WSL2 的虚拟磁盘（`ext4.vhdx`）位于 C 盘：

```text
C:\Users\<用户名>\AppData\Local\Packages\...
```

对于系统盘容量有限的开发机器来说，将 WSL 迁移到其他磁盘（如 E 盘）是一个非常合理的选择。

本文记录一次完整的迁移过程，包括：

- 导出 Ubuntu
- 注销旧发行版
- 导入到 E 盘
- 验证环境
- 解决常见报错
- 保证原有开发环境可继续使用

<!--more-->

---

## 为什么迁移 WSL

WSL2 实际上运行在一个虚拟磁盘中：

```text
ext4.vhdx
```

常见占用来源：

- Ubuntu 系统本身
- Python 虚拟环境
- Node.js 项目
- Docker 镜像
- 数据库文件
- AI 模型

19GB 对于开发环境来说属于正常范围。

但是：

```text
C盘容量有限
E盘容量充足
```

因此决定迁移。

---

## 查看当前 WSL 状态

首先查看当前发行版：

```powershell
wsl --list --verbose
```

例如：

```text
NAME      STATE    VERSION
Ubuntu    Running  2
```

确认：

- 使用的是 WSL2
- 当前发行版名称为 Ubuntu

---

## 第一步：关闭 WSL

迁移前关闭所有实例：

```powershell
wsl --shutdown
```

---

## 第二步：导出 Ubuntu

创建备份目录：

```powershell
mkdir E:\WSL_Backup
```

导出发行版：

```powershell
wsl --export Ubuntu E:\WSL_Backup\Ubuntu-2026-06-17.tar
```

导出完成后确认文件存在：

```powershell
dir E:\WSL_Backup
```

应该看到：

```text
Ubuntu-2026-06-17.tar
```

---

## 第三步：注销旧发行版

确认备份成功后：

```powershell
wsl --unregister Ubuntu
```

此操作会：

- 删除原来的发行版注册信息
- 删除 C 盘中的 `ext4.vhdx`

此时执行：

```powershell
wsl -l -v
```

Ubuntu 应该已经消失。

---

## 第四步：创建新的安装目录

例如：

```powershell
mkdir E:\WSL\Ubuntu
```

目录结构：

```text
E:
├─WSL
│  └─Ubuntu
└─WSL_Backup
   └─Ubuntu-2026-06-17.tar
```

---

## 第五步：重新导入到 E 盘

这里是最关键的一步。

正确命令：

```powershell
wsl --import Ubuntu E:\WSL\Ubuntu E:\WSL_Backup\Ubuntu-2026-06-17.tar --version 2
```

参数说明：

| 参数 | 含义 |
|------|------|
| `Ubuntu` | 发行版名称 |
| `E:\WSL\Ubuntu` | 安装目录 |
| `Ubuntu-2026-06-17.tar` | 备份文件 |
| `--version 2` | 指定使用 WSL2 |

---

## 常见错误：Wsl/E_INVALIDARG

错误示例：

```text
参数错误
错误代码: Wsl/E_INVALIDARG
```

原因：命令格式错误。

例如：

```powershell
wsl --import Ubuntu E:\WSL_Backup\Ubuntu-2026-06-17.tar --version 2
```

少了安装目录参数。

正确格式必须是：

```powershell
wsl --import 名称 安装目录 tar文件
```

---

## 验证迁移是否成功

查看发行版：

```powershell
wsl -l -v
```

例如：

```text
NAME      STATE    VERSION
Ubuntu    Stopped  2
```

启动：

```powershell
wsl -d Ubuntu
```

进入系统后：

```bash
whoami
pwd
```

如果能够正常进入：

```text
/home/<user>
```

说明系统已经恢复。

---

## 常见错误：WSL_E_DISTRO_NOT_FOUND

错误示例：

```text
不存在具有所提供名称的分发

WSL_E_DISTRO_NOT_FOUND
```

出现原因通常是：

- Windows Terminal 保存了旧配置
- 原 Ubuntu 已注销
- 新 Ubuntu 已重新导入

此时：

```powershell
wsl -d Ubuntu
```

如果能够正常进入系统，说明 WSL 本身没问题，仅仅是 Terminal 配置失效。

解决办法：删除旧 Profile，重新创建：

```text
wsl.exe -d Ubuntu
```

即可。

---

## 常见错误：WSL_E_NOT_A_LINUX_DISTRO

错误示例：

```text
WSL_E_NOT_A_LINUX_DISTRO
```

原因：导入的 tar 文件并不是 Linux RootFS。

WSL 要求导入的内容必须包含：

```text
/etc
/usr
/bin
/lib
```

检查方法：

```powershell
tar -tf Ubuntu.tar
```

正常情况应看到：

```text
etc/
usr/
bin/
lib/
```

如果看到：

```text
Users/
Desktop/
Documents/
```

说明导出的文件不是 Linux 根文件系统，需要重新导出。

---

## 如何确认数据已经迁移到 E 盘

关闭 WSL：

```powershell
wsl --shutdown
```

查看：

```powershell
dir E:\WSL\Ubuntu
```

应该能看到：

```text
ext4.vhdx
```

例如：

```text
ext4.vhdx 19GB
```

说明 Linux 文件系统已经位于 E 盘。

---

## 验证开发环境是否完整

迁移完成后建议检查：

```bash
python3 --version
node --version
git --version
docker --version
```

以及：

```bash
ls ~
```

确认：

- 项目代码存在
- Python 环境存在
- Node 环境存在
- Git 配置正常

---

## Docker 用户特别注意

如果安装了 Docker Desktop，执行：

```powershell
wsl -l -v
```

可能看到：

```text
docker-desktop
docker-desktop-data
```

很多时候真正占空间的是：

```text
docker-desktop-data
```

其占用甚至可能超过 Ubuntu 本身。

迁移 Ubuntu 不会自动迁移 Docker 数据，需要单独处理 Docker 存储位置。

---

## 迁移后的目录建议

推荐结构：

```text
E:
└─WSL
   ├─Ubuntu
   ├─Debian
   ├─Arch
   └─Docker
```

方便后续管理多个 Linux 环境。

---

## 总结

本次迁移的核心步骤：

```powershell
wsl --shutdown

wsl --export Ubuntu E:\WSL_Backup\Ubuntu.tar

wsl --unregister Ubuntu

mkdir E:\WSL\Ubuntu

wsl --import Ubuntu E:\WSL\Ubuntu E:\WSL_Backup\Ubuntu.tar --version 2
```

验证：

```powershell
wsl -d Ubuntu
```

如果能够正常进入系统，并且：

```text
E:\WSL\Ubuntu\ext4.vhdx
```

已经生成，则说明迁移成功。

最终结果：

- 释放 C 盘空间
- 保留原有 Linux 环境
- 保留开发工具和项目
- 保持 VS Code、Docker、Python 等工作流不变

对于长期使用 WSL 进行开发的用户，这是最稳妥、最推荐的迁移方案。


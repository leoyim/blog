# Linux自启动服务配置和启用


<!--more-->

> 本文使用以下Go项目作为配置示例，编译后获得可执行程序`main`

```go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.GET("/hello", hello)

	r.Run(":8080")
}

func hello(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"[MESAGE]": "Hello World!"})
}
```
> 执行可执行程序后，可在本地访问`http://localhost:8080/hello`接口，如下所示：
```bash
[root@VM-12-5-centos ~]# curl http://localhost:8080/hello
{"[MESAGE]":"Hello World!"}
```

在 Linux 系统中，可以使用 systemd 管理自启动服务。以下是配置和启用自启动服务的基本步骤：

## 1 创建服务文件
服务文件一般位于 /etc/systemd/system/ 目录下，文件名以 .service 结尾
```bash
vi /etc/systemd/system/my_service.service
```

在文件中添加以下内容：

```ini
[Unit]
Description=My Custom Service
After=network.target

[Service]
ExecStart=/path/to/your/executable_or_script
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

> Description：对服务的描述。
> After：指定服务应在什么条件下启动（例如 network.target 表示在网络服务启动后）。
> ExecStart：定义服务启动时执行的命令（可以是可执行文件或脚本）。
> Restart：定义服务在失败时是否自动重启（可选项）。

## 2 重新加载 systemd 配置
添加或修改 .service 文件后，重新加载 systemd 配置：
```bash
sudo systemctl daemon-reload
```

## 3 手动启动服务
```bash
sudo systemctl start my_service.service
```

## 4 启用服务
```bash
sudo systemctl enable my_service.service
```

## 5 查看服务状态
```bash
sudo systemctl status my_service.service
```

## 6 停止服务
```bash
sudo systemctl stop my_service.service
```

## 7 禁用服务
```bash
sudo systemctl disable my_service.service
```

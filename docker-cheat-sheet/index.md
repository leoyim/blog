# Docker备忘清单


本文记录了Docker的常用命令

<!--more-->

1. 获取 Docker 帮助信息

   ```shell
   docker --help
   ```
2. 获取 Docker 版本号

   ```shell
   docker version
   ```
3. 从远程仓库下载指定的镜像到本地

   ```shell
   docker pull <image>
   ```
4. 根据 Dockerfile 构建一个新的镜像

   ```
   docker build -t <image> -f <dockerfile> .
   ```
5. 列出本地已下载的镜像列表

   ```shell
   docker images
   ```
6. 列出正在运行的容器

   ```shell
   docker ps
   # 列出所有容器（包括已停止的容器）
   docker ps -a
   ```
7. 启动一个已停止的容器

   ```shell
   docker start <container>
   ```
8. 停止一个正在运行的容器

   ```
   docker stop <container>
   ```
9. 重启一个容器

   ```shell
   docker restart <container>
   ```
10. 在正在运行的容器中执行命令

    ```shell
    docker exec <container> <command>
    ```
11. 删除指定的容器

    ```shell
    docker rm <container>
    ```
12. 删除指定的镜像名

    ```shell
    docker rmi <image>
    ```
13. 将镜像转换为压缩文件

    ```shell
    docker save -o <tar> <image>
    ```
14. 将压缩文件转换为镜像

    ```shell
    docker load -i <tar>
    ```
15. 将容器快照保存为新的镜像

    ```shell
    docker commit <container> <image>
    ```
16. 获取Docker对象(容器、镜像、网络、数据卷等)的低级配置和状态信息

    ```shell
    docker inspect <image>|<container>|<volume>|<network>
    ```
17. 用于在容器与主机之间的复制文件或目录

    ```shell
    # 容器 -> 主机
    docker cp <container>:<containerfilePath> <localFilePath>
    # 主机 -> 容器
    docker cp <localFilePath> <container>:<containerfilePath>
    ```
18. 显示Docker主机系统相关信息

    ```shell
    docker system info
    ```
19. 显示Docker使用空间情况的系统报告

    ```shell
    docker system df
    ```
20. 查找Docker Hub上的镜像
    
    ```shell
    docker search ubuntu
    ```
21. 查看容器日志
    
    ```shell
    docker logs <container>
    ```
22. 给镜像创建一个标签

    ```shell
    docker tag <image> <tag>
    ```
23. 运行一个镜像
    
    ```shell
    docker run -name <container> <image>
    ```

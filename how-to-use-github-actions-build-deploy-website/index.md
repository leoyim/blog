# 如何使用GitHub Actions构建并部署网站

本文记录了作者是如何使用Github Actions完成本站的自动化构建与部署。
<!--more-->
题图源：[an-introduction-to-github-actions](https://gabrieltanner.org/blog/an-introduction-to-github-actions "an-introduction-to-github-actions")

---

> [GitHub Actions](https://docs.github.com/zh/actions) 是 [GitHub](https://github.com/) 提供的自动化工作流服务，可用于自动化构建、测试和部署软件项目。它允许开发者根据事件触发执行自定义任务，如提交代码时自动运行测试、定时任务等。通过简单的配置文件，即可实现CI/CD流程，提高开发效率并促进团队协作。

本站采用GitHub Actions来完成自动化构建与发布，通过配置代码提交自动触发执行，每当将源码提交至Github仓库，便触发一次构建和发布，极大提升了构建与部署效率。

##
```yaml
# This is a basic workflow to help you get started with Actions

name: CI

# Controls when the workflow will run
on:
  # Triggers the workflow on push or pull request events but only for the main branch
  push:
    branches: [ main ]

# A workflow run is made up of one or more jobs that can run sequentially or in parallel
jobs:
  # This workflow contains a single job called "build"
  build:
    # The type of runner that the job will run on
    runs-on: ubuntu-latest

    # Steps represent a sequence of tasks that will be executed as part of the job
    steps:

      - name: 安装 Go 1.17
        uses: actions/setup-go@v1
        with:
          go-version: 1.17
        id: go

      - name: 验证 Go 安装及版本
        run: go version

      # Checks-out your repository under $GITHUB_WORKSPACE, so your job can access it
      - name: 签入项目源代码
        uses: actions/checkout@v2

      - name: 安装 Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: '0.88.1'
          extended: true

      - name: 验证 Hugo 安装及版本
        run: hugo version

      - name: 编译 Hugo项目
        run: hugo && ls -lrt

      - name: 登录Docker Hub
        env:
          DOCKER_USERNAME: ${{secrets.DOCKER_USERNAME}}
          DOCKER_PASSWORD: ${{secrets.DOCKER_PASSWORD}}
        run: docker version && echo "${DOCKER_PASSWORD}" | docker login --username "${DOCKER_USERNAME}" --password-stdin

      # - name: 安装buildx
      #   uses: crazy-max/ghaction-docker-buildx@v1
      #   with:
      #     buildx-version: latest

      - name: 构建镜像并推送至DockerHub,再删除本地镜像
        env:
          DOCKER_USERNAME: ${{secrets.DOCKER_USERNAME}}
        run:
          commitId="${{ github.event.commits[0].id }}" &&
          docker build --tag ${DOCKER_USERNAME}/blog:"${commitId}" . &&
          docker images &&
          docker push ${DOCKER_USERNAME}/blog:"${commitId}" &&
          docker rmi ${DOCKER_USERNAME}/blog:"${commitId}"
      
      - name: 容器更新部署到服务器
        env:
          DOCKER_REPO: ${{secrets.DOCKER_REPO}}
        uses: appleboy/ssh-action@master
        with:
          host: ${{secrets.DEPLOY_HOST}}
          username: ${{secrets.DEPLOY_USER}}
          key: ${{secrets.DEPLOY_SECRET}}
          port: ${{secrets.DEPLOY_PORT}}
          script:
            docker stop blog &&
            docker rm blog &&
            docker images | grep blog | awk '{print $3}' | xargs docker rmi &&
            docker run -d --name blog -p 80:80 leoyim/blog:${{ github.event.commits[0].id }}
            
```

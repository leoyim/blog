# Kubernetes备忘清单


本文记录了Kubernetes的常用命令

<!--more-->


1.显示所有命名空间
```shell
kubectl get namespace
# OR
kubectl get ns
```
2.显示Pod
```shell
# 显示所有Pod
kubectl get pod
# 显示某一个命名空间下的Pod
kubectl get pod -n <namespace>
```
3.创建一个Pod
```shell
kubectl run <pod> --image=<image>
```
4.显示资源的详细信息
```shell
kubectl describe pod|node <pod>|<node>
```
5.显示所有节点
```shell
kubectl get node
```
6.删除Pod
```shell
kubectl delete pod <pod>
```
7.编辑Pod资源的YAML定义文件
```shell
kubectl edit pod <pod>
```

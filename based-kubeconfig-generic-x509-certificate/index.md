# 通过Kubeconfig文件生成X509证书

本文记录了从Kubernetes集群kubeconfig.yaml文件提取生成X509证书的方法。

<!--more-->

题图源：[Kubernetes certificate expiration “X509”](https://blog.stackademic.com/kubernetes-certificate-expiration-x509-792e48175967)

---

## 1 查看kubeconfig.yaml

> 可以使用VSCode等文本编辑器打开kubeconfig.yaml文件，或者在终端使用cat, less或more命令查看具体内容。

kubeconfig文件的结构通常包含一个或多个clusters部分，每个部分里有cluster、user和contexts等字段。X509证书通常存储在clusters下的cluster段落中的certificate-authority-data字段和users下的某个用户段落中的client-certificate-data及client-key-data字段，这些字段用于存储kubectl客户端与Kubernetes API服务器进行身份验证所需的凭据。

* **client-key** 此字段存储客户端证书的私钥。客户端证书用于将 `kubectl`客户端验证到API服务器。私钥必须保密，因为它可用于冒充客户端。
* **client-certificate** 此字段以PEM格式存储客户端证书。客户端证书用于将 `kubectl`客户端验证到API服务器。证书必须由受信任的证书颁发机构(CA)签名。
* **cluster-ca-certificate** 此字段以PEM格式存储API服务器的CA证书。CA证书用于验证API服务器证书的真实性。CA 证书必须受kubectl客户端信任。

{{< admonition >}}
client-key 和 client-certificate 字段应保密。cluster-ca-certificate 字段可以与他人共享，用于验证API服务器证书的真实性。
{{< /admonition >}}

## 2 提取证书和密钥

> 证书数据是以Base64编码的形式存储的。你可以使用以下命令来解码这些数据并将其保存为PEM文件：

```sh
# 提取集群CA证书到ca.crt
echo "$(base64 -d <<< $(grep 'certificate-authority-data' kubeconfig.yaml | awk '{print $2}'))" > ca.crt

# 提取客户端证书到client.crt
echo "$(base64 -d <<< $(grep 'client-certificate-data' kubeconfig.yaml | awk '{print $2}'))" > client.crt

# 提取客户端私钥到client.key
echo "$(base64 -d <<< $(grep 'client-key-data' kubeconfig.yaml | awk '{print $2}'))" > client.key

```

## 3 验证证书

解码并保存后，你可以使用openssl命令行工具来验证生成的证书和私钥是否有效，这个命令会显示客户端证书的详细信息，包括有效期等。

```sh
openssl x509 -in client.crt -text -noout
```


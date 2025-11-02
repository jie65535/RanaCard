# 后端（FastAPI）

## 启动

- 安装依赖：`pip install -r requirements.txt`
- 开发运行：`uvicorn main:app --reload`
- 健康检查：`GET http://localhost:8000/api/health`

## API（M1）
- `GET /api/data/card` | `/api/data/pendant` 返回官方数据（同 `/baseline/*` 兼容）
- `POST /api/validate?kind=card|pendant|mapevent|begineffect` 结构校验与简单约束
- `POST /api/decode` multipart 上传加密文件 -> 返回 JSON
- `POST /api/encode` body `{ payload }` -> 返回加密文本（可直接保存为游戏同名文件）

读取路径基于仓库根目录的 `Data/`。

## Docker（生产部署）

推荐使用仓库根目录的 `docker-compose.yml` 一键部署前后端（默认仅本机 127.0.0.1:8080 暴露前端）：

1. 构建并启动：
   - `docker compose up -d --build`
   - 前端地址：`http://localhost:8080`
2. 后端容器名：`zgdg-backend`，前端容器名：`zgdg-web`
3. `./Data` 会只读挂载到后端容器 `/app/Data`

### 持久化用户分享

为避免容器重建后分享数据丢失，`docker-compose.yml` 已将宿主机目录 `./server/uploads` 挂载到容器路径 `/app/server/uploads`。该目录下的 `share/*.json` 与 `index.json` 会跨重启保留。

如使用命名卷替代本地目录，示例：

```
volumes:
  - share_uploads:/app/server/uploads

...
volumes:
  share_uploads:
```

## 分享改动（极简）

接口（无账号、无审核）：

- `POST /api/share`
  - Body: `{ meta: { title, author, description, baseDataVersion? }, data: { cards?, pendants?, mapEvents?, beginEffects? } }`
  - 服务端对包含的部分逐项复用 `/api/validate` 校验，保存为 `server/uploads/share/{id}.json`
  - 返回：`{ id, url, manageToken }`
- `GET /api/share?q=关键词&limit=30` 列表最近分享（不含敏感字段）
- `GET /api/share/{id}` 下载原始 JSON（导入即可）
- `DELETE /api/share/{id}?manageToken=...` 持令牌可删除自己的分享

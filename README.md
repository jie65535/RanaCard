# 种呱得呱

游戏数据：`RanaCard\RanaCard_Data\StreamingAssets\*.json`

## 加密算法

- 算法: `AES`
- KEY: `sd14WDS66sdwgy423Sbfhk`
- IV: `sdagjusasxa`

## 解密游戏文件

用Python运行脚本，会自动读取 `C:\Program Files (x86)\Steam\steamapps\common\RanaCard\RanaCard_Data\StreamingAssets` 目录下的json并进行解密到目录下的 `Data` 文件夹中

```cmd
python .\DecodeAssets.py
```

## 加密游戏文件

用Python运行脚本，会将 `Data` 目录下的 `Cards.json`（在脚本里修改目标） 加密回 `C:\Program Files (x86)\Steam\steamapps\common\RanaCard\RanaCard_Data\StreamingAssets` 下。

```cmd
python .\EncodeAssets.py
```

## 备注

本游戏数据JSON都是2空格缩进，除了 `Card.json` 以外的都有缩进，建议用VSCode在 `Card.json` 里用 `Ctrl+Shift+P` 打开命令输入 `Format Document` 格式化代码。

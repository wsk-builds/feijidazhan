# 飞机大战

关卡制纵版射击游戏，支持桌面键鼠与手机触控。

## 在线游玩

开启 GitHub Pages 后访问：

**https://wsk-builds.github.io/feijidazhan/**

（仓库 Settings → Pages → Source: `main` / root）

## 本地运行

```bash
python -m http.server 8080
```

浏览器打开 http://127.0.0.1:8080/

## 手机操作

- **单指拖动**：战机跟随指尖移动
- **💣 / 🚀**：地雷与导弹（需储备）
- **⚙**：展开战机状态抽屉
- 支持竖屏全屏与「添加到主屏幕」（PWA）

## 验证

```bash
node .verify-tmp/verify.cjs
node tests/mobile.spec.cjs
```